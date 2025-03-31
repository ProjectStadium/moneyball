const { Player, Team, Tournament, Match, PlayerMatch, Earnings } = require('../models');
const scraper = require('./vlrScraper.service');
const liquipediaService = require('./liquipedia.service');

class DataIntegrationService {
    constructor() {
        this.Player = Player;
        this.Team = Team;
        this.Tournament = Tournament;
        this.Match = Match;
        this.PlayerMatch = PlayerMatch;
        this.Earnings = Earnings;
    }

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

    async importTournamentData(limit = 10) {
        try {
            console.log('Starting tournament data import...');
            const tournaments = await liquipediaService.getTournamentList({ limit });
            
            for (const tournamentData of tournaments) {
                try {
                    // Get detailed tournament data
                    const details = await liquipediaService.getTournamentPage(tournamentData.title);
                    
                    // Create or update tournament record
                    const [tournament] = await Tournament.findOrCreate({
                        where: { title: tournamentData.title },
                        defaults: {
                            title: tournamentData.title,
                            start_date: tournamentData.timestamp,
                            url: tournamentData.url,
                            status: 'completed',
                            type: 'tournament',
                            tier: 'other'  // You might want to parse this from the details
                        }
                    });

                    // Parse and store participant data
                    if (details && details.parse && details.parse.text) {
                        const participants = this.parseParticipants(details.parse.text);
                        await this.processParticipants(tournament.id, participants);
                    }

                    console.log(`Processed tournament: ${tournamentData.title}`);
                } catch (error) {
                    console.error(`Error processing tournament ${tournamentData.title}:`, error);
                }
            }

            return { success: true, message: `Processed ${tournaments.length} tournaments` };
        } catch (error) {
            console.error('Error importing tournament data:', error);
            throw error;
        }
    }

    parseParticipants(htmlContent) {
        // This is a placeholder - you'll need to implement proper HTML parsing
        // You might want to use cheerio or another HTML parser
        return [];
    }

    async processParticipants(tournamentId, participants) {
        for (const participant of participants) {
            try {
                // Search for player in Liquipedia
                const searchResults = await liquipediaService.searchPlayer(participant.name);
                if (searchResults && searchResults.length > 0) {
                    const playerData = await liquipediaService.getPlayerPage(searchResults[0].title);
                    
                    // Create or update player record
                    const [player] = await Player.findOrCreate({
                        where: { name: participant.name },
                        defaults: {
                            name: participant.name,
                            liquipedia_url: searchResults[0].url,
                            is_free_agent: true  // Default to true, update based on data
                        }
                    });

                    // Get player matches for this tournament
                    const matches = await liquipediaService.getPlayerMatches(searchResults[0].title);
                    await this.processPlayerMatches(player.id, tournamentId, matches);

                    // Process earnings if available
                    if (playerData.earnings) {
                        await this.processPlayerEarnings(player.id, tournamentId, playerData.earnings);
                    }
                }
            } catch (error) {
                console.error(`Error processing participant: ${participant.name}`, error);
            }
        }
    }

    async processPlayerMatches(playerId, tournamentId, matches) {
        for (const matchData of matches) {
            try {
                // Create or update match record
                const [match] = await Match.findOrCreate({
                    where: {
                        tournament_id: tournamentId,
                        match_id: matchData.id || `${tournamentId}-${playerId}-${Date.now()}`
                    },
                    defaults: {
                        // Add match details
                        tournament_id: tournamentId,
                        date: matchData.date,
                        map: matchData.map,
                        score: matchData.score
                    }
                });

                // Create player-match association
                await PlayerMatch.findOrCreate({
                    where: {
                        player_id: playerId,
                        match_id: match.id
                    },
                    defaults: {
                        player_id: playerId,
                        match_id: match.id,
                        // Add performance stats
                        kills: matchData.kills,
                        deaths: matchData.deaths,
                        assists: matchData.assists,
                        agent: matchData.agent
                    }
                });
            } catch (error) {
                console.error(`Error processing match for player ${playerId}:`, error);
            }
        }
    }

    async processPlayerEarnings(playerId, tournamentId, earningsData) {
        try {
            await Earnings.findOrCreate({
                where: {
                    player_id: playerId,
                    tournament_id: tournamentId
                },
                defaults: {
                    player_id: playerId,
                    tournament_id: tournamentId,
                    amount: earningsData.amount,
                    currency: earningsData.currency || 'USD',
                    placement: earningsData.placement
                }
            });
        } catch (error) {
            console.error(`Error processing earnings for player ${playerId}:`, error);
        }
    }

    async searchAndImportPlayer(name) {
        try {
            console.log(`Searching for player: ${name}`);
            const searchResults = await liquipediaService.searchPlayer(name);
            
            if (!searchResults || searchResults.length === 0) {
                return { success: false, message: 'No players found' };
            }

            const results = [];
            for (const result of searchResults) {
                try {
                    // Get detailed player data
                    const playerData = await liquipediaService.getPlayerPage(result.title);
                    
                    // Create or update player record
                    const [player] = await Player.findOrCreate({
                        where: { name: result.title },
                        defaults: {
                            name: result.title,
                            liquipedia_url: result.url,
                            is_free_agent: true,  // Default to true, update based on data
                            description: result.description
                        }
                    });

                    // Get and process player matches
                    const matches = await liquipediaService.getPlayerMatches(result.title);
                    await this.processPlayerMatches(player.id, null, matches);

                    // Process earnings if available
                    if (playerData.earnings) {
                        await this.processPlayerEarnings(player.id, null, playerData.earnings);
                    }

                    results.push({
                        success: true,
                        player: player.toJSON(),
                        matches_processed: matches ? matches.length : 0,
                        earnings_processed: playerData.earnings ? true : false
                    });
                } catch (error) {
                    console.error(`Error processing player ${result.title}:`, error);
                    results.push({
                        success: false,
                        title: result.title,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                results,
                total_processed: results.length,
                successful: results.filter(r => r.success).length
            };
        } catch (error) {
            console.error('Error searching and importing player:', error);
            throw error;
        }
    }
}

module.exports = new DataIntegrationService(); 