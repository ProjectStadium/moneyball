const db = require('../models');

class DivisionCalculator {
  constructor() {
    this.db = db;
    this.TIER_TO_DIVISION = {
      'S': 'T1',
      'A': 'T1',
      'B': 'T2',
      'C': 'T3',
      'Qualifier': 'T3'
    };
    
    // Configuration for division changes
    this.PROMOTION_THRESHOLD = 0.75; // Top 25% placement for promotion
    this.RELEGATION_THRESHOLD = 0.25; // Bottom 25% placement for relegation
    this.CONSISTENCY_THRESHOLD = 3; // Number of tournaments needed at a tier for "consistency"
  }

  async calculatePlayerDivision(playerId) {
    try {
      // Get player's tournament history
      const history = await this.db.PlayerTournamentHistory.findAll({
        where: { player_id: playerId },
        include: [{
          model: this.db.Tournament,
          attributes: ['tier', 'start_date', 'name']
        }],
        order: [['createdAt', 'DESC']]
      });

      if (!history.length) {
        return {
          current_division: 'T3',
          consistency_score: 0,
          tournaments_at_current_division: 0,
          last_division_change: null,
          division_history: [],
          highest_division_achieved: 'T3',
          notes: 'No tournament history available'
        };
      }

      // Analyze recent performance
      const recentTournaments = history.slice(0, 5); // Last 5 tournaments
      const currentDivision = this.calculateCurrentDivision(recentTournaments);
      const consistencyScore = this.calculateConsistencyScore(history);
      const tournamentsAtCurrentDiv = this.countTournamentsAtDivision(history, currentDivision);
      
      // Track division changes
      const divisionHistory = this.buildDivisionHistory(history);
      const highestDivision = this.findHighestDivision(divisionHistory);
      
      return {
        current_division: currentDivision,
        consistency_score: consistencyScore,
        tournaments_at_current_division: tournamentsAtCurrentDiv,
        last_division_change: divisionHistory[0]?.date || null,
        division_history: divisionHistory,
        highest_division_achieved: highestDivision,
        notes: this.generateNotes(currentDivision, consistencyScore, tournamentsAtCurrentDiv)
      };
    } catch (error) {
      console.error('Error calculating player division:', error);
      throw error;
    }
  }

  calculateCurrentDivision(recentTournaments) {
    if (!recentTournaments.length) return 'T3';

    const divisionCounts = recentTournaments.reduce((acc, record) => {
      const division = this.TIER_TO_DIVISION[record.Tournament.tier];
      acc[division] = (acc[division] || 0) + 1;
      return acc;
    }, {});

    // Find the most common division
    return Object.entries(divisionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  calculateConsistencyScore(history) {
    if (!history.length) return 0;

    const recentHistory = history.slice(0, 10); // Look at last 10 tournaments
    const divisions = recentHistory.map(record => this.TIER_TO_DIVISION[record.Tournament.tier]);
    
    // Calculate how many times they stayed in the same division
    let consistencyCount = 0;
    for (let i = 1; i < divisions.length; i++) {
      if (divisions[i] === divisions[i - 1]) {
        consistencyCount++;
      }
    }

    return Math.round((consistencyCount / (divisions.length - 1)) * 100);
  }

  countTournamentsAtDivision(history, division) {
    let count = 0;
    for (const record of history) {
      if (this.TIER_TO_DIVISION[record.Tournament.tier] === division) {
        count++;
      } else {
        break; // Stop counting when we hit a different division
      }
    }
    return count;
  }

  buildDivisionHistory(history) {
    return history.map(record => ({
      date: record.Tournament.start_date,
      division: this.TIER_TO_DIVISION[record.Tournament.tier],
      tournament_name: record.Tournament.name,
      placement: record.placement,
      division_change: record.division_change
    }));
  }

  findHighestDivision(divisionHistory) {
    const divisions = ['T1', 'T2', 'T3', 'T4'];
    for (const div of divisions) {
      if (divisionHistory.some(record => record.division === div)) {
        return div;
      }
    }
    return 'T3';
  }

  generateNotes(currentDivision, consistencyScore, tournamentsAtDiv) {
    const notes = [];
    
    if (consistencyScore >= 80) {
      notes.push(`High consistency at ${currentDivision} level`);
    } else if (consistencyScore <= 30) {
      notes.push('Inconsistent performance across divisions');
    }

    if (tournamentsAtDiv >= this.CONSISTENCY_THRESHOLD) {
      notes.push(`Established ${currentDivision} player`);
    } else {
      notes.push(`Recently moved to ${currentDivision}`);
    }

    return notes.join('. ');
  }
}

module.exports = new DivisionCalculator(); 