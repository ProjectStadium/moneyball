const { Player, Team } = require('../models');
const scraper = require('./vlrScraper.service');
const liquipediaService = require('./liquipedia.service');

class DataIntegrationService {
    async scrapeVLRData(playerId) {
        try {
            const player = await Player.findByPk(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            // Use the existing scraper service to get player details
            const playerData = await scraper.scrapeAndSavePlayerDetails(playerId, player.vlr_url);
            return playerData;
        } catch (error) {
            console.error('Error scraping VLR data:', error);
            throw error;
        }
    }

    async fetchLiquipediaData(playerId) {
        try {
            const player = await Player.findByPk(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            // Use the existing liquipedia service to get player earnings and tournament history
            const earningsData = await liquipediaService.processPlayerEarnings(playerId);
            return earningsData;
        } catch (error) {
            console.error('Error fetching Liquipedia data:', error);
            throw error;
        }
    }

    async enrichPlayerData(playerId) {
        try {
            const player = await Player.findByPk(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            // Fetch additional data from both sources
            const [vlrData, liquipediaData] = await Promise.all([
                this.scrapeVLRData(playerId),
                this.fetchLiquipediaData(playerId)
            ]);

            // Update player's country code if it's missing or different from VLR data
            if (vlrData && vlrData.country_code && (!player.country_code || player.country_code !== vlrData.country_code)) {
                await player.update({ country_code: vlrData.country_code });
                console.log(`Updated country code for ${player.name}: ${vlrData.country_code}`);
            }

            // Combine and update player data
            const enrichedData = {
                ...player.toJSON(),
                vlr_stats: vlrData,
                tournament_history: liquipediaData
            };

            return enrichedData;
        } catch (error) {
            console.error('Error enriching player data:', error);
            throw error;
        }
    }

    async getFreeAgents() {
        try {
            const freeAgents = await Player.findAll({
                where: { is_free_agent: true },
                include: [{
                    model: Team,
                    attributes: ['name', 'region']
                }]
            });

            // Enrich each free agent's data and update country codes
            const enrichedFreeAgents = await Promise.all(
                freeAgents.map(async (agent) => {
                    try {
                        const enrichedData = await this.enrichPlayerData(agent.id);
                        return enrichedData;
                    } catch (error) {
                        console.error(`Error enriching free agent ${agent.name}:`, error);
                        return agent.toJSON();
                    }
                })
            );

            return enrichedFreeAgents;
        } catch (error) {
            console.error('Error fetching free agents:', error);
            throw error;
        }
    }
}

module.exports = new DataIntegrationService(); 