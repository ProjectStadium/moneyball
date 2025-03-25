const vlrScraper = require('../../services/vlrScraper.service');
const cheerio = require('cheerio');

describe('VLRScraper Service', () => {
  describe('extractPlayerData', () => {
    it('should correctly extract player data from a row', () => {
      const html = `
        <tr>
          <td class="mod-player">
            <a href="/player/123/player-name">Player Name</a>
            <img src="/img/vlr/game/agents/jett.png" alt="jett">
          </td>
          <td class="mod-team">
            <a href="/team/456/team-name">Team Name</a>
          </td>
          <td class="stats-player-country">
            <span class="mod-flag mod-us"></span>
            United States
          </td>
          <td class="mod-rnd">100</td>
          <td class="mod-cl">5/10</td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>1.2</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>250.5</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>1.5</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>75%</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>150.2</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.8</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.6</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.4</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.3</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>25%</span></span>
          </td>
          <td class="mod-agents">
            <img class="mod-small" src="/img/vlr/game/agents/jett.png" alt="jett">
            <img class="mod-small" src="/img/vlr/game/agents/omen.png" alt="omen">
            <div>(+2)</div>
          </td>
        </tr>
      `;

      const $ = cheerio.load(html);
      const $row = $('tr');
      const playerData = vlrScraper.extractPlayerData($, $row);

      expect(playerData).toBeTruthy();
      expect(playerData.name).toBe('Player Name');
      expect(playerData.team_name).toBe('Team Name');
      expect(playerData.country_code).toBe('us');
      expect(playerData.country_name).toBe('United States');
      expect(playerData.rounds_played).toBe(100);
      expect(playerData.clutches_won).toBe(5);
      expect(playerData.clutches_played).toBe(10);
      expect(playerData.stats.rating).toBe(1.2);
      expect(playerData.stats.acs).toBe(250.5);
      expect(playerData.stats.kd).toBe(1.5);
      expect(playerData.stats.kast).toBe(0.75);
      expect(playerData.stats.adr).toBe(150.2);
      expect(playerData.stats.kpr).toBe(0.8);
      expect(playerData.stats.apr).toBe(0.6);
      expect(playerData.stats.fkpr).toBe(0.4);
      expect(playerData.stats.fdpr).toBe(0.3);
      expect(playerData.stats.hs).toBe(0.25);
      expect(playerData.agent_images).toHaveLength(4); // 2 visible + 2 additional
      expect(playerData.visible_agents).toBe(2);
      expect(playerData.additional_agents).toBe(2);
      expect(playerData.roles).toContain('Duelist');
      expect(playerData.roles).toContain('Controller');
      expect(playerData.primary_role).toBe('Duelist');
    });

    it('should handle free agents correctly', () => {
      const html = `
        <tr>
          <td class="mod-player">
            <a href="/player/123/player-name">Player Name</a>
            <img src="/img/vlr/game/agents/jett.png" alt="jett">
          </td>
          <td class="mod-team">
            <a href="/team/456/team-name">No Team</a>
          </td>
          <td class="stats-player-country">
            <span class="mod-flag mod-us"></span>
            United States
          </td>
          <td class="mod-rnd">100</td>
          <td class="mod-cl">5/10</td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>1.2</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>250.5</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>1.5</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>75%</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>150.2</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.8</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.6</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.4</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.3</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>25%</span></span>
          </td>
          <td class="mod-agents">
            <img class="mod-small" src="/img/vlr/game/agents/jett.png" alt="jett">
          </td>
        </tr>
      `;

      const $ = cheerio.load(html);
      const $row = $('tr');
      const playerData = vlrScraper.extractPlayerData($, $row);

      expect(playerData.is_free_agent).toBe(true);
      expect(playerData.free_agent_badge).toBe('FA');
      expect(playerData.team_name).toBeNull();
      expect(playerData.team_abbreviation).toBeNull();
    });
  });

  describe('extractStats', () => {
    it('should correctly extract all stats from a row', () => {
      const html = `
        <tr>
          <td class="mod-color-sq">
            <span class="color-sq"><span>1.2</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>250.5</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>1.5</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>75%</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>150.2</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.8</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.6</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.4</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>0.3</span></span>
          </td>
          <td class="mod-color-sq">
            <span class="color-sq"><span>25%</span></span>
          </td>
        </tr>
      `;

      const $ = cheerio.load(html);
      const $row = $('tr');
      const stats = vlrScraper.extractStats($row);

      expect(stats.rating).toBe(1.2);
      expect(stats.acs).toBe(250.5);
      expect(stats.kd).toBe(1.5);
      expect(stats.kast).toBe(0.75);
      expect(stats.adr).toBe(150.2);
      expect(stats.kpr).toBe(0.8);
      expect(stats.apr).toBe(0.6);
      expect(stats.fkpr).toBe(0.4);
      expect(stats.fdpr).toBe(0.3);
      expect(stats.hs).toBe(0.25);
    });
  });

  describe('extractAgentData', () => {
    it('should correctly extract agent data and roles', () => {
      const html = `
        <tr>
          <td class="mod-agents">
            <img class="mod-small" src="/img/vlr/game/agents/jett.png" alt="jett">
            <img class="mod-small" src="/img/vlr/game/agents/omen.png" alt="omen">
            <div>(+2)</div>
          </td>
        </tr>
      `;

      const $ = cheerio.load(html);
      const $row = $('tr');
      const agentData = vlrScraper.extractAgentData($row);

      expect(agentData.images).toHaveLength(4); // 2 visible + 2 additional
      expect(agentData.visibleAgents).toBe(2);
      expect(agentData.additionalAgents).toBe(2);
      expect(agentData.roles).toContain('Duelist');
      expect(agentData.roles).toContain('Controller');
      expect(agentData.primaryRole).toBe('Duelist');
      expect(agentData.usage).toHaveProperty('jett');
      expect(agentData.usage).toHaveProperty('omen');
    });
  });

  describe('determinePlayerDivision', () => {
    it('should correctly determine player division based on tournament history', () => {
      const t1History = ['VCT 2024', 'Masters Tokyo'];
      const t2History = ['Challengers Ascension 2024'];
      const t3History = ['Game Changers Series 3'];
      const t4History = ['Collegiate Championship'];
      const unknownHistory = ['Unknown Tournament'];

      expect(vlrScraper.determinePlayerDivision(t1History)).toBe('T1');
      expect(vlrScraper.determinePlayerDivision(t2History)).toBe('T2');
      expect(vlrScraper.determinePlayerDivision(t3History)).toBe('T3');
      expect(vlrScraper.determinePlayerDivision(t4History)).toBe('T4');
      expect(vlrScraper.determinePlayerDivision(unknownHistory)).toBe('Unranked');
    });
  });

  describe('calculatePlayerValue', () => {
    it('should calculate player value correctly', () => {
      const stats = {
        rating: 1.2,
        acs: 250.5,
        kd: 1.5,
        kast: 0.75,
        adr: 150.2
      };

      const value = vlrScraper.calculatePlayerValue(stats);
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  describe('estimatePlayerValue', () => {
    it('should estimate player value correctly', () => {
      const stats = {
        rating: 1.2,
        acs: 250.5,
        kd: 1.5,
        adr: 150.2
      };

      const value = vlrScraper.estimatePlayerValue(stats);
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });

    it('should return null for incomplete stats', () => {
      const stats = {
        rating: 1.2,
        acs: null,
        kd: 1.5,
        adr: 150.2
      };

      const value = vlrScraper.estimatePlayerValue(stats);
      expect(value).toBeNull();
    });
  });
}); 