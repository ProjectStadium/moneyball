console.log('POSTGRES_HOST in test file:', process.env.POSTGRES_HOST);

import * as chai from 'chai'; // Use namespace import for Chai
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { sequelize, db } from '../../src/utils/database.js'; // Use ES Module import
import app from '../../src/app.js'; // Use ES Module import


chai.use(chaiHttp);
const { expect } = chai;

describe('Analysis API Endpoints', function () {
  let server;

  before(async function () {
    // Start the server and sync the database
    server = app.listen(3001); // Use a test port
    await sequelize.sync({ force: true }); // Reset the database
  });

  after(async function () {
    // Close the server and database connection
    await server.close();
    await sequelize.close();
  });

  beforeEach(async function () {
    // Stub database methods and add sample data
    sinon.stub(db.Team, 'bulkCreate').resolves();
    sinon.stub(db.Player, 'bulkCreate').resolves();

    await db.Team.bulkCreate([
      { id: 1, name: 'Team A' },
      { id: 2, name: 'Team B' },
    ]);

    await db.Player.bulkCreate([
      { id: 1, name: 'Player 1', team_id: 1 },
      { id: 2, name: 'Player 2', team_id: 2 },
    ]);
  });

  afterEach(async function () {
    // Restore stubs and clear database
    sinon.restore();
    await sequelize.truncate({ cascade: true });
  });

  it('GET /api/analysis/players/similar/:player_id should return similar players', async function () {
    const res = await chai.request(server).get('/api/analysis/players/similar/1');
    expect(res).to.have.status(200);
    expect(res.body).to.have.property('similar_players');
    expect(res.body.similar_players).to.be.an('array');
  });

  it('GET /api/analysis/market/free-agents should return free agent market analysis', async function () {
    const res = await chai.request(server).get('/api/analysis/market/free-agents');
    expect(res).to.have.status(200);
    expect(res.body).to.have.property('free_agents');
    expect(res.body.free_agents).to.be.an('array');
  });
});