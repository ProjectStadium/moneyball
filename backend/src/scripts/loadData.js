require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const { sequelize } = require('../utils/database');
const { Team, Player } = require('../models');

async function loadData() {
    try {
        // Start transaction
        const transaction = await sequelize.transaction();

        try {
            // Load teams first
            console.log('Loading teams...');
            const teamsData = await new Promise((resolve, reject) => {
                const teams = [];
                fs.createReadStream(path.join(__dirname, '../../../data/updated_esport_teams.csv'))
                    .pipe(csv.parse({ columns: true, skip_empty_lines: true }))
                    .on('data', (row) => {
                        // Convert types
                        const team = {
                            ...row,
                            rank: parseInt(row.rank) || null,
                            score: parseFloat(row.score) || null,
                            earnings: parseFloat(row.earnings) || null,
                            founded_year: row.founded_year ? parseInt(row.founded_year) : null,
                            created_at: new Date(),
                            updated_at: new Date()
                        };
                        teams.push(team);
                    })
                    .on('end', () => resolve(teams))
                    .on('error', reject);
            });

            await Team.bulkCreate(teamsData, {
                transaction,
                updateOnDuplicate: ['full_team_name', 'tag', 'region', 'country', 'country_code', 'rank', 'score', 'record', 'earnings', 'founded_year', 'game', 'logo_url', 'updated_at']
            });
            console.log(`Loaded ${teamsData.length} teams`);

            // Load players
            console.log('Loading players...');
            const playersData = await new Promise((resolve, reject) => {
                const players = [];
                fs.createReadStream(path.join(__dirname, '../../../data/valorant_players.csv'))
                    .pipe(csv.parse({ columns: true, skip_empty_lines: true }))
                    .on('data', (row) => {
                        // Convert types
                        const player = {
                            ...row,
                            is_free_agent: row.is_free_agent.toLowerCase() === 'true',
                            acs: parseFloat(row.acs) || null,
                            kd_ratio: parseFloat(row.kd_ratio) || null,
                            adr: parseFloat(row.adr) || null,
                            kpr: parseFloat(row.kpr) || null,
                            apr: parseFloat(row.apr) || null,
                            fk_pr: parseFloat(row.fk_pr) || null,
                            fd_pr: parseFloat(row.fd_pr) || null,
                            hs_pct: parseFloat(row.hs_pct) || null,
                            rating: parseFloat(row.rating) || null,
                            leaderboard_rank: parseInt(row.leaderboard_rank) || null,
                            ranked_rating: parseInt(row.ranked_rating) || null,
                            number_of_wins: parseInt(row.number_of_wins) || null,
                            created_at: new Date(),
                            updated_at: new Date(),
                            last_updated: new Date()
                        };
                        players.push(player);
                    })
                    .on('end', () => resolve(players))
                    .on('error', reject);
            });

            await Player.bulkCreate(playersData, {
                transaction,
                updateOnDuplicate: ['full_identifier', 'player_img_url', 'team_name', 'team_abbreviation', 'team_logo_url', 'country_name', 'country_code', 'is_free_agent', 'acs', 'kd_ratio', 'adr', 'kpr', 'apr', 'fk_pr', 'fd_pr', 'hs_pct', 'rating', 'source', 'current_act', 'leaderboard_rank', 'ranked_rating', 'number_of_wins', 'updated_at', 'last_updated']
            });
            console.log(`Loaded ${playersData.length} players`);

            // Commit transaction
            await transaction.commit();
            console.log('All data loaded successfully!');

        } catch (error) {
            // Rollback transaction on error
            await transaction.rollback();
            console.error('Transaction rolled back:', error);
            throw error;
        }

    } catch (error) {
        console.error('Error loading data:', error);
        process.exit(1);
    }
}

// Run the data loading
loadData(); 