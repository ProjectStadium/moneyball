const dataIntegrationService = require('../services/dataIntegrationService');

class DataIntegrationController {
    async getFreeAgents(req, res) {
        try {
            const freeAgents = await dataIntegrationService.getFreeAgents();
            res.json(freeAgents);
        } catch (error) {
            console.error('Error in getFreeAgents controller:', error);
            res.status(500).json({ error: 'Failed to fetch free agents' });
        }
    }

    async enrichPlayerData(req, res) {
        try {
            const { playerId } = req.params;
            const enrichedData = await dataIntegrationService.enrichPlayerData(playerId);
            res.json(enrichedData);
        } catch (error) {
            console.error('Error in enrichPlayerData controller:', error);
            res.status(500).json({ error: 'Failed to enrich player data' });
        }
    }
}

module.exports = new DataIntegrationController(); 