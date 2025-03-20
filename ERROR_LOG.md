
> moneyball@1.0.0 test
> jest --detectOpenHandles

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

 FAIL  __tests__/services/scraper.service.test.js (8.291 s)
  ValorantScraper Service
    × makeRequest should call axios with correct parameters (3 ms)
    × makeRequest should handle errors properly (10 ms)
    × scrapePlayerList should parse player data correctly (3 ms)
    × extractPlayerFromStatsPage should extract player details correctly (12 ms)
    × calculateRating should compute player rating correctly (2 ms)
    × estimatePlayerValue should calculate player value based on stats (1 ms)
    × scrapePlayerDetail should extract detailed player information (4 ms)
    × determinePlaystylesFromAgents should analyze agent usage correctly (2 ms)
    × determinePlayerDivision should classify player tier correctly (2 ms)
    × determinePlayerDivision should return the correct division (1 ms)
    × scrapeAndSavePlayerDetails should save player details to database (2 ms)
    × scrapeAllPlayers should scrape player list and save to database (1 ms)

  ● ValorantScraper Service › makeRequest should call axios with correct parameters

    TypeError: scraperService.makeRequest is not a function

      68 |
      69 |     // Execute
    > 70 |     const result = await scraperService.makeRequest('https://www.vlr.gg/test');
         |                                         ^
      71 |
      72 |     // Verify
      73 |     expect(axios.get).toHaveBeenCalledWith('https://www.vlr.gg/test', expect.objectContaining({

      at Object.makeRequest (__tests__/services/scraper.service.test.js:70:41)

  ● ValorantScraper Service › makeRequest should handle errors properly

    TypeError: scraperService.makeRequest is not a function

      85 |
      86 |     // Execute & Verify
    > 87 |     await expect(scraperService.makeRequest('https://www.vlr.gg/error')).rejects.toThrow('Network Error');
         |                                 ^
      88 |   });
      89 |
      90 |   // Test scrapePlayerList method

      at Object.makeRequest (__tests__/services/scraper.service.test.js:87:33)

  ● ValorantScraper Service › scrapePlayerList should parse player data correctly

    TypeError: scraperService.scrapePlayerList is not a function

      111 |
      112 |     // Execute
    > 113 |     const players = await scraperService.scrapePlayerList(1);
          |                                          ^
      114 |
      115 |     // Verify
      116 |     expect(axios.get).toHaveBeenCalledWith('https://www.vlr.gg/stats/players?page=1', expect.anything());

      at Object.scrapePlayerList (__tests__/services/scraper.service.test.js:113:42)

  ● ValorantScraper Service › extractPlayerFromStatsPage should extract player details correctly

    TypeError: scraperService.extractPlayerFromStatsPage is not a function

      143 |
      144 |     // Execute
    > 145 |     const player = scraperService.extractPlayerFromStatsPage($, element);
          |                                   ^
      146 |
      147 |     // Verify
      148 |     expect(player).toHaveProperty('name', 'TestPlayer');

      at Object.extractPlayerFromStatsPage (__tests__/services/scraper.service.test.js:145:35)

  ● ValorantScraper Service › calculateRating should compute player rating correctly

    TypeError: scraperService.calculateRating is not a function

      158 |   test('calculateRating should compute player rating correctly', () => {
      159 |     // Execute
    > 160 |     const rating = scraperService.calculateRating(250, 1.2, 150);
          |                                   ^
      161 |
      162 |     // Verify - Check that result is a number with reasonable value
      163 |     expect(typeof rating).toBe('number');

      at Object.calculateRating (__tests__/services/scraper.service.test.js:160:35)

  ● ValorantScraper Service › estimatePlayerValue should calculate player value based on stats

    TypeError: scraperService.estimatePlayerValue is not a function

      169 |   test('estimatePlayerValue should calculate player value based on stats', () => {
      170 |     // Execute
    > 171 |     const value = scraperService.estimatePlayerValue(250, 1.2, 150, 0.8, 0.6, 0.15, 0.12, 25);
          |                                  ^
      172 |
      173 |     // Verify
      174 |     expect(typeof value).toBe('number');

      at Object.estimatePlayerValue (__tests__/services/scraper.service.test.js:171:34)

  ● ValorantScraper Service › scrapePlayerDetail should extract detailed player information

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "https://www.vlr.gg/player/123", Anything

    Number of calls: 0

      213 |
      214 |     // Verify
    > 215 |     expect(axios.get).toHaveBeenCalledWith('https://www.vlr.gg/player/123', expect.anything());
          |                       ^
      216 |     expect(playerDetails).toHaveProperty('agent_usage');
      217 |     expect(playerDetails.agent_usage).toHaveProperty('Jett');
      218 |     expect(playerDetails).toHaveProperty('division');

      at Object.toHaveBeenCalledWith (__tests__/services/scraper.service.test.js:215:23)

  ● ValorantScraper Service › determinePlaystylesFromAgents should analyze agent usage correctly

    TypeError: scraperService.determinePlaystylesFromAgents is not a function

      230 |
      231 |     // Execute
    > 232 |     const playstyleInfo = scraperService.determinePlaystylesFromAgents(agentUsage);
          |                                          ^
      233 |
      234 |     // Verify
      235 |     expect(playstyleInfo).toHaveProperty('primary_roles');

      at Object.determinePlaystylesFromAgents (__tests__/services/scraper.service.test.js:232:42)

  ● ValorantScraper Service › determinePlayerDivision should classify player tier correctly

    TypeError: scraperService.determinePlayerDivision is not a function

      244 |   test('determinePlayerDivision should classify player tier correctly', () => {
      245 |     // Execute with different tournament histories
    > 246 |     const t1Division = scraperService.determinePlayerDivision(['VCT Masters', 'Some Other Tournament']);
          |                                       ^
      247 |     const t2Division = scraperService.determinePlayerDivision(['Challengers Ascension', 'Some Local Tournament']);
      248 |     const t3Division = scraperService.determinePlayerDivision(['Game Changers', 'College Tournament']);
      249 |     const unrankedDivision = scraperService.determinePlayerDivision(['Unknown Tournament']);

      at Object.determinePlayerDivision (__tests__/services/scraper.service.test.js:246:39)

  ● ValorantScraper Service › determinePlayerDivision should return the correct division

    TypeError: scraperService.determinePlayerDivision is not a function

      258 |   test('determinePlayerDivision should return the correct division', () => {
      259 |     const playerStats = { rating: 1.2 }; // Adjust mock data to match the logic
    > 260 |     const division = scraperService.determinePlayerDivision(playerStats);
          |                                     ^
      261 |     expect(division).toBe('T2'); // Ensure the expected value matches the logic
      262 |   });
      263 |

      at Object.determinePlayerDivision (__tests__/services/scraper.service.test.js:260:37)

  ● ValorantScraper Service › scrapeAndSavePlayerDetails should save player details to database

    TypeError: scraperService.scrapeAndSavePlayerDetails is not a function

      276 |
      277 |     // Execute
    > 278 |     const result = await scraperService.scrapeAndSavePlayerDetails('test-id', '/player/123');
          |                                         ^
      279 |
      280 |     // Verify
      281 |     expect(scraperService.scrapePlayerDetail).toHaveBeenCalledWith('/player/123');

      at Object.scrapeAndSavePlayerDetails (__tests__/services/scraper.service.test.js:278:41)

  ● ValorantScraper Service › scrapeAllPlayers should scrape player list and save to database

    Property `scrapePlayerList` does not exist in the provided object

      304 |
      305 |     // Mock scrapePlayerList to return our test player
    > 306 |     jest.spyOn(scraperService, 'scrapePlayerList').mockResolvedValue([mockPlayer]);
          |          ^
      307 |
      308 |     // Mock scrapeAndSavePlayerDetails to succeed
      309 |     jest.spyOn(scraperService, 'scrapeAndSavePlayerDetails').mockResolvedValue(true);

      at ModuleMocker.spyOn (node_modules/jest-mock/build/index.js:731:13)
      at Object.spyOn (__tests__/services/scraper.service.test.js:306:10)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

 FAIL  __tests__/models/player.model.test.js
  ● Player Model › should create a player with required fields

    TypeError: Cannot read properties of undefined (reading 'sync')

      13 |   // Clear database before all tests
      14 |   beforeAll(async () => {
    > 15 |     await sequelize.sync({ force: true });
         |                     ^
      16 |   });
      17 |
      18 |   // Clear database after each test

      at Object.sync (__tests__/models/player.model.test.js:15:21)

  ● Player Model › should create a player with required fields

    TypeError: Cannot read properties of undefined (reading 'destroy')

      18 |   // Clear database after each test
      19 |   afterEach(async () => {
    > 20 |     await Player.destroy({ where: {}, truncate: true });
         |                  ^
      21 |   });
      22 |
      23 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/player.model.test.js:20:18)

  ● Player Model › should not create a player without required name field

    TypeError: Cannot read properties of undefined (reading 'sync')

      13 |   // Clear database before all tests
      14 |   beforeAll(async () => {
    > 15 |     await sequelize.sync({ force: true });
         |                     ^
      16 |   });
      17 |
      18 |   // Clear database after each test

      at Object.sync (__tests__/models/player.model.test.js:15:21)

  ● Player Model › should not create a player without required name field

    TypeError: Cannot read properties of undefined (reading 'destroy')

      18 |   // Clear database after each test
      19 |   afterEach(async () => {
    > 20 |     await Player.destroy({ where: {}, truncate: true });
         |                  ^
      21 |   });
      22 |
      23 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/player.model.test.js:20:18)

  ● Player Model › should create a player with all fields

    TypeError: Cannot read properties of undefined (reading 'sync')

      13 |   // Clear database before all tests
      14 |   beforeAll(async () => {
    > 15 |     await sequelize.sync({ force: true });
         |                     ^
      16 |   });
      17 |
      18 |   // Clear database after each test

      at Object.sync (__tests__/models/player.model.test.js:15:21)

  ● Player Model › should create a player with all fields

    TypeError: Cannot read properties of undefined (reading 'destroy')

      18 |   // Clear database after each test
      19 |   afterEach(async () => {
    > 20 |     await Player.destroy({ where: {}, truncate: true });
         |                  ^
      21 |   });
      22 |
      23 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/player.model.test.js:20:18)

  ● Player Model › should not create players with duplicate names

    TypeError: Cannot read properties of undefined (reading 'sync')

      13 |   // Clear database before all tests
      14 |   beforeAll(async () => {
    > 15 |     await sequelize.sync({ force: true });
         |                     ^
      16 |   });
      17 |
      18 |   // Clear database after each test

      at Object.sync (__tests__/models/player.model.test.js:15:21)

  ● Player Model › should not create players with duplicate names

    TypeError: Cannot read properties of undefined (reading 'destroy')

      18 |   // Clear database after each test
      19 |   afterEach(async () => {
    > 20 |     await Player.destroy({ where: {}, truncate: true });
         |                  ^
      21 |   });
      22 |
      23 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/player.model.test.js:20:18)

  ● Player Model › should set default values correctly

    TypeError: Cannot read properties of undefined (reading 'sync')

      13 |   // Clear database before all tests
      14 |   beforeAll(async () => {
    > 15 |     await sequelize.sync({ force: true });
         |                     ^
      16 |   });
      17 |
      18 |   // Clear database after each test

      at Object.sync (__tests__/models/player.model.test.js:15:21)

  ● Player Model › should set default values correctly

    TypeError: Cannot read properties of undefined (reading 'destroy')

      18 |   // Clear database after each test
      19 |   afterEach(async () => {
    > 20 |     await Player.destroy({ where: {}, truncate: true });
         |                  ^
      21 |   });
      22 |
      23 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/player.model.test.js:20:18)

  ● Player Model › should handle JSON fields properly

    TypeError: Cannot read properties of undefined (reading 'sync')

      13 |   // Clear database before all tests
      14 |   beforeAll(async () => {
    > 15 |     await sequelize.sync({ force: true });
         |                     ^
      16 |   });
      17 |
      18 |   // Clear database after each test

      at Object.sync (__tests__/models/player.model.test.js:15:21)

  ● Player Model › should handle JSON fields properly

    TypeError: Cannot read properties of undefined (reading 'destroy')

      18 |   // Clear database after each test
      19 |   afterEach(async () => {
    > 20 |     await Player.destroy({ where: {}, truncate: true });
         |                  ^
      21 |   });
      22 |
      23 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/player.model.test.js:20:18)

  ● Player Model › should be able to query players by various fields

    TypeError: Cannot read properties of undefined (reading 'sync')

      13 |   // Clear database before all tests
      14 |   beforeAll(async () => {
    > 15 |     await sequelize.sync({ force: true });
         |                     ^
      16 |   });
      17 |
      18 |   // Clear database after each test

      at Object.sync (__tests__/models/player.model.test.js:15:21)

  ● Player Model › should be able to query players by various fields

    TypeError: Cannot read properties of undefined (reading 'destroy')

      18 |   // Clear database after each test
      19 |   afterEach(async () => {
    > 20 |     await Player.destroy({ where: {}, truncate: true });
         |                  ^
      21 |   });
      22 |
      23 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/player.model.test.js:20:18)


  ● Test suite failed to run

    TypeError: Cannot read properties of undefined (reading 'close')

      23 |   // Close database connection after all tests
      24 |   afterAll(async () => {
    > 25 |     await sequelize.close();
         |                     ^
      26 |   });
      27 |
      28 |   // Test player creation with required fields

      at Object.close (__tests__/models/player.model.test.js:25:21)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

  console.error
    Error finding similar players: TypeError: Cannot read properties of undefined (reading 'ne')
        at Object.ne [as findSimilarPlayers] (A:\moneyball\src\controllers\analysis.controller.js:26:17)
        at Object.<anonymous> (A:\moneyball\__tests__\controllers\analysis.controller.test.js:156:7)

      109 |     });
      110 |   } catch (error) {
    > 111 |     console.error('Error finding similar players:', error);
          |             ^
      112 |     res.status(500).json({
      113 |       message: error.message || 'An error occurred while finding similar players.'
      114 |     });

      at Object.error [as findSimilarPlayers] (src/controllers/analysis.controller.js:111:13)
      at Object.<anonymous> (__tests__/controllers/analysis.controller.test.js:156:7)

  console.error
    Error finding similar players: TypeError: Cannot read properties of undefined (reading 'ne')
        at Object.ne [as findSimilarPlayers] (A:\moneyball\src\controllers\analysis.controller.js:26:17)
        at Object.<anonymous> (A:\moneyball\__tests__\controllers\analysis.controller.test.js:190:7)

      109 |     });
      110 |   } catch (error) {
    > 111 |     console.error('Error finding similar players:', error);
          |             ^
      112 |     res.status(500).json({
      113 |       message: error.message || 'An error occurred while finding similar players.'
      114 |     });

      at Object.error [as findSimilarPlayers] (src/controllers/analysis.controller.js:111:13)
      at Object.<anonymous> (__tests__/controllers/analysis.controller.test.js:190:7)

  console.error
    Error analyzing free agent market: TypeError: Cannot read properties of undefined (reading 'gte')
        at Object.gte [as getFreeAgentMarketAnalysis] (A:\moneyball\src\controllers\analysis.controller.js:130:48)
        at Object.getFreeAgentMarketAnalysis (A:\moneyball\__tests__\controllers\analysis.controller.test.js:215:32)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusTest (A:\moneyball\node_modules\jest-circus\build\run.js:316:40)
        at _runTest (A:\moneyball\node_modules\jest-circus\build\run.js:252:3)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:126:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

      188 |     res.json(analysis);
      189 |   } catch (error) {
    > 190 |     console.error('Error analyzing free agent market:', error);
          |             ^
      191 |     res.status(500).json({
      192 |       message: error.message || 'An error occurred while analyzing the free agent market.'
      193 |     });

      at Object.error [as getFreeAgentMarketAnalysis] (src/controllers/analysis.controller.js:190:13)
      at Object.getFreeAgentMarketAnalysis (__tests__/controllers/analysis.controller.test.js:215:32)

  console.error
    Error comparing players: TypeError: Cannot read properties of undefined (reading 'in')
        at Object.in [as comparePlayers] (A:\moneyball\src\controllers\analysis.controller.js:263:19)
        at Object.comparePlayers (A:\moneyball\__tests__\controllers\analysis.controller.test.js:228:32)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusTest (A:\moneyball\node_modules\jest-circus\build\run.js:316:40)
        at _runTest (A:\moneyball\node_modules\jest-circus\build\run.js:252:3)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:126:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

      302 |     });
      303 |   } catch (error) {
    > 304 |     console.error('Error comparing players:', error);
          |             ^
      305 |     res.status(500).json({
      306 |       message: error.message || 'An error occurred while comparing players.'
      307 |     });

      at Object.error [as comparePlayers] (src/controllers/analysis.controller.js:304:13)
      at Object.comparePlayers (__tests__/controllers/analysis.controller.test.js:228:32)

  console.error
    Error getting player valuation: TypeError: Cannot read properties of undefined (reading 'ne')
        at Object.ne [as getPlayerValuation] (A:\moneyball\src\controllers\analysis.controller.js:330:19)
        at Object.<anonymous> (A:\moneyball\__tests__\controllers\analysis.controller.test.js:257:7)

      373 |     res.json(valuation);
      374 |   } catch (error) {
    > 375 |     console.error('Error getting player valuation:', error);
          |             ^
      376 |     res.status(500).json({
      377 |       message: error.message || 'An error occurred while calculating player valuation.'
      378 |     });

      at Object.error [as getPlayerValuation] (src/controllers/analysis.controller.js:375:13)
      at Object.<anonymous> (__tests__/controllers/analysis.controller.test.js:257:7)

  console.error
    Error generating optimal roster: TypeError: Cannot read properties of undefined (reading 'gte')
        at Object.gte [as generateOptimalRoster] (A:\moneyball\src\controllers\analysis.controller.js:212:21)
        at Object.generateOptimalRoster (A:\moneyball\__tests__\controllers\analysis.controller.test.js:286:32)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusTest (A:\moneyball\node_modules\jest-circus\build\run.js:316:40)
        at _runTest (A:\moneyball\node_modules\jest-circus\build\run.js:252:3)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:126:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

      236 |     });
      237 |   } catch (error) {
    > 238 |     console.error('Error generating optimal roster:', error);
          |             ^
      239 |     res.status(500).json({
      240 |       message: error.message || 'An error occurred while generating the optimal roster.'
      241 |     });

      at Object.error [as generateOptimalRoster] (src/controllers/analysis.controller.js:238:13)
      at Object.generateOptimalRoster (__tests__/controllers/analysis.controller.test.js:286:32)

 FAIL  __tests__/controllers/analysis.controller.test.js
  Analysis Controller
    findSimilarPlayers
      × should find players similar to a specified player (56 ms)
      √ should return 404 for non-existent player (2 ms)
      × should filter for free agents only when specified (11 ms)
    getFreeAgentMarketAnalysis
      √ should provide market analysis of free agents (6 ms)
      √ should filter free agent analysis by minimum rating (12 ms)
    comparePlayers
      × should compare multiple players side by side (13 ms)
      √ should return 400 when player_ids are not provided (2 ms)
    getPlayerValuation
      × should return valuation details for a player (10 ms)
      √ should return 404 for non-existent player (1 ms)
    generateOptimalRoster
      × should generate an optimal roster based on constraints (12 ms)

  ● Analysis Controller › findSimilarPlayers › should find players similar to a specified player

    expect(jest.fn()).not.toHaveBeenCalled()

    Expected number of calls: 0
    Received number of calls: 1

    1: 500

      157 |
      158 |       expect(res.json).toHaveBeenCalled();
    > 159 |       expect(res.status).not.toHaveBeenCalled();
          |                              ^
      160 |
      161 |       const response = res.json.mock.calls[0][0];
      162 |       expect(response).toHaveProperty('target_player');

      at Object.toHaveBeenCalled (__tests__/controllers/analysis.controller.test.js:159:30)

  ● Analysis Controller › findSimilarPlayers › should filter for free agents only when specified

    TypeError: Cannot read properties of undefined (reading 'every')

      191 |
      192 |       const response = res.json.mock.calls[0][0];
    > 193 |       expect(response.similar_players.every(player => player.is_free_agent)).toBeTruthy();
          |                                       ^
      194 |     });
      195 |   });
      196 |

      at Object.every (__tests__/controllers/analysis.controller.test.js:193:39)

  ● Analysis Controller › comparePlayers › should compare multiple players side by side

    expect(received).toHaveProperty(path)

    Expected path: "players"
    Received path: []

    Received value: {"message": "Cannot read properties of undefined (reading 'in')"}

      230 |       expect(res.json).toHaveBeenCalled();
      231 |       const response = res.json.mock.calls[0][0];
    > 232 |       expect(response).toHaveProperty('players');
          |                        ^
      233 |       expect(response).toHaveProperty('metrics');
      234 |       expect(response.players.length).toEqual(2);
      235 |       expect(response.players[0].id).toEqual(player1Id);

      at Object.toHaveProperty (__tests__/controllers/analysis.controller.test.js:232:24)

  ● Analysis Controller › getPlayerValuation › should return valuation details for a player

    expect(received).toHaveProperty(path)

    Expected path: "player"
    Received path: []

    Received value: {"message": "Cannot read properties of undefined (reading 'ne')"}

      259 |       expect(res.json).toHaveBeenCalled();
      260 |       const response = res.json.mock.calls[0][0];
    > 261 |       expect(response).toHaveProperty('player');
          |                        ^
      262 |       expect(response).toHaveProperty('comparable_players');
      263 |       expect(response).toHaveProperty('valuation_factors');
      264 |       expect(response).toHaveProperty('market_context');

      at Object.toHaveProperty (__tests__/controllers/analysis.controller.test.js:261:24)

  ● Analysis Controller › generateOptimalRoster › should generate an optimal roster based on constraints

    expect(received).toHaveProperty(path)

    Expected path: "roster"
    Received path: []

    Received value: {"message": "Cannot read properties of undefined (reading 'gte')"}

      288 |       expect(res.json).toHaveBeenCalled();
      289 |       const response = res.json.mock.calls[0][0];
    > 290 |       expect(response).toHaveProperty('roster');
          |                        ^
      291 |       expect(response).toHaveProperty('team_stats');
      292 |       expect(response).toHaveProperty('total_cost');
      293 |       expect(response).toHaveProperty('budget_remaining');

      at Object.toHaveProperty (__tests__/controllers/analysis.controller.test.js:290:24)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

 FAIL  __tests__/models/team.model.test.js
  ● Team Model › should create a team with required fields

    TypeError: Cannot read properties of undefined (reading 'sync')

      14 |   // Clear database before all tests
      15 |   beforeAll(async () => {
    > 16 |     await sequelize.sync({ force: true });
         |                     ^
      17 |   });
      18 |
      19 |   // Clear database after each test

      at Object.sync (__tests__/models/team.model.test.js:16:21)

  ● Team Model › should create a team with required fields

    TypeError: Cannot read properties of undefined (reading 'destroy')

      19 |   // Clear database after each test
      20 |   afterEach(async () => {
    > 21 |     await Team.destroy({ where: {}, truncate: true, cascade: true });
         |                ^
      22 |   });
      23 |
      24 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/team.model.test.js:21:16)

  ● Team Model › should not create a team without the required team_abbreviation field

    TypeError: Cannot read properties of undefined (reading 'sync')

      14 |   // Clear database before all tests
      15 |   beforeAll(async () => {
    > 16 |     await sequelize.sync({ force: true });
         |                     ^
      17 |   });
      18 |
      19 |   // Clear database after each test

      at Object.sync (__tests__/models/team.model.test.js:16:21)

  ● Team Model › should not create a team without the required team_abbreviation field

    TypeError: Cannot read properties of undefined (reading 'destroy')

      19 |   // Clear database after each test
      20 |   afterEach(async () => {
    > 21 |     await Team.destroy({ where: {}, truncate: true, cascade: true });
         |                ^
      22 |   });
      23 |
      24 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/team.model.test.js:21:16)

  ● Team Model › should create a team with all fields

    TypeError: Cannot read properties of undefined (reading 'sync')

      14 |   // Clear database before all tests
      15 |   beforeAll(async () => {
    > 16 |     await sequelize.sync({ force: true });
         |                     ^
      17 |   });
      18 |
      19 |   // Clear database after each test

      at Object.sync (__tests__/models/team.model.test.js:16:21)

  ● Team Model › should create a team with all fields

    TypeError: Cannot read properties of undefined (reading 'destroy')

      19 |   // Clear database after each test
      20 |   afterEach(async () => {
    > 21 |     await Team.destroy({ where: {}, truncate: true, cascade: true });
         |                ^
      22 |   });
      23 |
      24 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/team.model.test.js:21:16)

  ● Team Model › should not create teams with duplicate team_abbreviations

    TypeError: Cannot read properties of undefined (reading 'sync')

      14 |   // Clear database before all tests
      15 |   beforeAll(async () => {
    > 16 |     await sequelize.sync({ force: true });
         |                     ^
      17 |   });
      18 |
      19 |   // Clear database after each test

      at Object.sync (__tests__/models/team.model.test.js:16:21)

  ● Team Model › should not create teams with duplicate team_abbreviations

    TypeError: Cannot read properties of undefined (reading 'destroy')

      19 |   // Clear database after each test
      20 |   afterEach(async () => {
    > 21 |     await Team.destroy({ where: {}, truncate: true, cascade: true });
         |                ^
      22 |   });
      23 |
      24 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/team.model.test.js:21:16)

  ● Team Model › should associate teams with players correctly

    TypeError: Cannot read properties of undefined (reading 'sync')

      14 |   // Clear database before all tests
      15 |   beforeAll(async () => {
    > 16 |     await sequelize.sync({ force: true });
         |                     ^
      17 |   });
      18 |
      19 |   // Clear database after each test

      at Object.sync (__tests__/models/team.model.test.js:16:21)

  ● Team Model › should associate teams with players correctly

    TypeError: Cannot read properties of undefined (reading 'destroy')

      19 |   // Clear database after each test
      20 |   afterEach(async () => {
    > 21 |     await Team.destroy({ where: {}, truncate: true, cascade: true });
         |                ^
      22 |   });
      23 |
      24 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/team.model.test.js:21:16)

  ● Team Model › should be able to query teams by various fields

    TypeError: Cannot read properties of undefined (reading 'sync')

      14 |   // Clear database before all tests
      15 |   beforeAll(async () => {
    > 16 |     await sequelize.sync({ force: true });
         |                     ^
      17 |   });
      18 |
      19 |   // Clear database after each test

      at Object.sync (__tests__/models/team.model.test.js:16:21)

  ● Team Model › should be able to query teams by various fields

    TypeError: Cannot read properties of undefined (reading 'destroy')

      19 |   // Clear database after each test
      20 |   afterEach(async () => {
    > 21 |     await Team.destroy({ where: {}, truncate: true, cascade: true });
         |                ^
      22 |   });
      23 |
      24 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/team.model.test.js:21:16)

  ● Team Model › should update team information correctly

    TypeError: Cannot read properties of undefined (reading 'sync')

      14 |   // Clear database before all tests
      15 |   beforeAll(async () => {
    > 16 |     await sequelize.sync({ force: true });
         |                     ^
      17 |   });
      18 |
      19 |   // Clear database after each test

      at Object.sync (__tests__/models/team.model.test.js:16:21)

  ● Team Model › should update team information correctly

    TypeError: Cannot read properties of undefined (reading 'destroy')

      19 |   // Clear database after each test
      20 |   afterEach(async () => {
    > 21 |     await Team.destroy({ where: {}, truncate: true, cascade: true });
         |                ^
      22 |   });
      23 |
      24 |   // Close database connection after all tests

      at Object.destroy (__tests__/models/team.model.test.js:21:16)


  ● Test suite failed to run

    TypeError: Cannot read properties of undefined (reading 'close')

      24 |   // Close database connection after all tests
      25 |   afterAll(async () => {
    > 26 |     await sequelize.close();
         |                     ^
      27 |   });
      28 |
      29 |   // Test team creation with required fields

      at Object.close (__tests__/models/team.model.test.js:26:21)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

  console.log
    Task added to queue. Current queue length: 1

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Task added to queue. Current queue length: 2

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Task added to queue. Current queue length: 1

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Processing task: player_detail for ID: test-player-id

      at ScraperScheduler.log [as processNextInQueue] (src/services/scheduler.service.js:176:13)

  console.log
    Task completed: player_detail for ID: test-player-id

      at ScraperScheduler.log [as processNextInQueue] (src/services/scheduler.service.js:190:15)

  console.log
    Task added to queue. Current queue length: 1

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Processing task: player_detail for ID: error-player-id

      at ScraperScheduler.log [as processNextInQueue] (src/services/scheduler.service.js:176:13)

  console.error
    Error processing task: player_detail Error: Test error
        at Object.<anonymous> (A:\moneyball\__tests__\services\scheduler.service.test.js:124:71)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusTest (A:\moneyball\node_modules\jest-circus\build\run.js:316:40)
        at _runTest (A:\moneyball\node_modules\jest-circus\build\run.js:252:3)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:126:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

      190 |       console.log(`Task completed: ${task.type} for ID: ${task.playerId || task.teamId}`);
      191 |     } catch (error) {
    > 192 |       console.error(`Error processing task: ${task.type}`, error);
          |               ^
      193 |
      194 |       // Requeue with lower priority if needed
      195 |       if (task.retries < 3) {

      at ScraperScheduler.error [as processNextInQueue] (src/services/scheduler.service.js:192:15)
      at Object.<anonymous> (__tests__/services/scheduler.service.test.js:136:7)

  console.log
    Requeuing task with retry 1

      at ScraperScheduler.log [as processNextInQueue] (src/services/scheduler.service.js:196:17)

  console.log
    Task added to queue. Current queue length: 1

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Task added to queue. Current queue length: 1

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Processing task: player_detail for ID: max-retry-player-id

      at ScraperScheduler.log [as processNextInQueue] (src/services/scheduler.service.js:176:13)

  console.error
    Error processing task: player_detail Error: Test error
        at Object.<anonymous> (A:\moneyball\__tests__\services\scheduler.service.test.js:153:71)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusTest (A:\moneyball\node_modules\jest-circus\build\run.js:316:40)
        at _runTest (A:\moneyball\node_modules\jest-circus\build\run.js:252:3)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:126:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

      190 |       console.log(`Task completed: ${task.type} for ID: ${task.playerId || task.teamId}`);
      191 |     } catch (error) {
    > 192 |       console.error(`Error processing task: ${task.type}`, error);
          |               ^
      193 |
      194 |       // Requeue with lower priority if needed
      195 |       if (task.retries < 3) {

      at ScraperScheduler.error [as processNextInQueue] (src/services/scheduler.service.js:192:15)
      at Object.<anonymous> (__tests__/services/scheduler.service.test.js:165:7)

  console.log
    Queue processor started

      at ScraperScheduler.log [as startQueueProcessor] (src/services/scheduler.service.js:160:13)

  console.log
    Scraper scheduler initialized

      at ScraperScheduler.log [as init] (src/services/scheduler.service.js:36:13)

  console.log
    Task added to queue. Current queue length: 1

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Triggering full data refresh (3 pages, detailed: true)

      at ScraperScheduler.log [as triggerFullRefresh] (src/services/scheduler.service.js:251:15)

  console.log
    Full data refresh completed

      at log (src/services/scheduler.service.js:257:19)

  console.log
    Task added to queue. Current queue length: 1

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

  console.log
    Task added to queue. Current queue length: 2

      at ScraperScheduler.log [as addToQueue] (src/services/scheduler.service.js:148:13)

 FAIL  __tests__/services/scheduler.service.test.js
  ScraperScheduler Service
    Queue Management
      √ addToQueue should add task and sort by priority (10 ms)
      √ processNextInQueue should process player_detail task correctly (9 ms)
      √ processNextInQueue should requeue tasks on failure with incremented retries (28 ms)
      √ processNextInQueue should discard tasks exceeding max retries (13 ms)
    Scheduling
      √ init should set up cron jobs correctly (11 ms)
      × scheduleDetailedPlayerUpdate should query outdated players and queue them (1 ms)
    Specific Methods
      √ updatePlayerDetails should add a high-priority task to the queue (4 ms)
      √ triggerFullRefresh should schedule a full data refresh (6 ms)
    Utility Methods
      √ getQueueStatus should return the current state of the queue (7 ms)

  ● ScraperScheduler Service › Scheduling › scheduleDetailedPlayerUpdate should query outdated players and queue them

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"where": Anything}

    Number of calls: 0

      203 |
      204 |       // Verify
    > 205 |       expect(db.Player.findAll).toHaveBeenCalledWith(expect.objectContaining({
          |                                 ^
      206 |         where: expect.anything()
      207 |       }));
      208 |

      at Object.toHaveBeenCalledWith (__tests__/services/scheduler.service.test.js:205:33)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

 FAIL  __tests__/utils/importData.test.js
  Import Data Utility
    × importTeamsFromCSV should parse and import team data correctly (2 ms)
    × importPlayersFromCSV should parse and import player data correctly (2 ms)
    × importAllData should import teams and players in correct order (6 ms)
    × importAllData should handle errors gracefully (1 ms)
    × runImport should exit with success code on successful import (2 ms)
    × runImport should exit with error code on failed import (2 ms)
    × should correctly handle boolean conversion for is_free_agent field (2 ms)

  ● Import Data Utility › importTeamsFromCSV should parse and import team data correctly

    TypeError: Cannot read properties of undefined (reading 'bulkCreate')

      39 |
      40 |   // Bulk insert teams with duplicate handling
    > 41 |   await db.Team.bulkCreate(formattedTeams, {
         |                 ^
      42 |     ignoreDuplicates: true,
      43 |     updateOnDuplicate: ['team_abbreviation']
      44 |   });

      at Object.bulkCreate [as importTeamsFromCSV] (src/utils/importData.js:41:17)
      at Object.importTeamsFromCSV (__tests__/utils/importData.test.js:63:26)

  ● Import Data Utility › importPlayersFromCSV should parse and import player data correctly

    TypeError: Cannot read properties of undefined (reading 'bulkCreate')

      90 |
      91 |   // Bulk insert players with duplicate handling
    > 92 |   await db.Player.bulkCreate(formattedPlayers, {
         |                   ^
      93 |     ignoreDuplicates: true,
      94 |     updateOnDuplicate: ['name']
      95 |   });

      at Object.bulkCreate [as importPlayersFromCSV] (src/utils/importData.js:92:19)
      at Object.importPlayersFromCSV (__tests__/utils/importData.test.js:112:26)

  ● Import Data Utility › importAllData should import teams and players in correct order

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      147 |
      148 |     // Verify
    > 149 |     expect(importDataUtil.importTeamsFromCSV).toHaveBeenCalled();
          |                                               ^
      150 |     expect(importDataUtil.importPlayersFromCSV).toHaveBeenCalled();
      151 |     // Teams should be imported before players (for foreign key relationships)
      152 |     const teamImportIndex = importDataUtil.importTeamsFromCSV.mock.invocationCallOrder[0];

      at Object.toHaveBeenCalled (__tests__/utils/importData.test.js:149:47)

  ● Import Data Utility › importAllData should handle errors gracefully

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      170 |
      171 |     // Verify
    > 172 |     expect(importDataUtil.importTeamsFromCSV).toHaveBeenCalled();
          |                                               ^
      173 |     expect(importDataUtil.importPlayersFromCSV).not.toHaveBeenCalled(); // Should not proceed to player import
      174 |     expect(result).toEqual({
      175 |       success: false,

      at Object.toHaveBeenCalled (__tests__/utils/importData.test.js:172:47)

  ● Import Data Utility › runImport should exit with success code on successful import

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      195 |
      196 |     // Verify
    > 197 |     expect(importDataUtil.importAllData).toHaveBeenCalled();
          |                                          ^
      198 |     expect(console.log).toHaveBeenCalledWith(expect.stringContaining('completed successfully'));
      199 |     expect(process.exit).toHaveBeenCalledWith(0);
      200 |

      at Object.toHaveBeenCalled (__tests__/utils/importData.test.js:197:42)

  ● Import Data Utility › runImport should exit with error code on failed import

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      216 |
      217 |     // Verify
    > 218 |     expect(importDataUtil.importAllData).toHaveBeenCalled();
          |                                          ^
      219 |     expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Import failed:'), 'Import failed');
      220 |     expect(process.exit).toHaveBeenCalledWith(1);
      221 |

      at Object.toHaveBeenCalled (__tests__/utils/importData.test.js:218:42)

  ● Import Data Utility › should correctly handle boolean conversion for is_free_agent field

    TypeError: Cannot read properties of undefined (reading 'bulkCreate')

      244 |
      245 |     // Verify correct boolean conversion
    > 246 |     const createdPlayers = db.Player.bulkCreate.mock.calls[0][0];
          |                                      ^
      247 |     expect(createdPlayers[0].is_free_agent).toBe(true);
      248 |     expect(createdPlayers[1].is_free_agent).toBe(false);
      249 |     expect(createdPlayers[2].is_free_agent).toBe(true);

      at Object.bulkCreate (__tests__/utils/importData.test.js:246:38)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

 FAIL  __tests__/utils/database.test.js
  Database Utility
    × should create Sequelize instance with correct parameters (25 ms)
    × should test database connection on load (5 ms)
    × should handle successful authentication (7 ms)
    × should exit process on authentication failure (5 ms)
    √ should exit if required env vars are missing (7 ms)
    × should use environment-specific logging settings (5 ms)
    × should initialize models correctly (4 ms)
    × should set up associations correctly (4 ms)

  ● Database Utility › should create Sequelize instance with correct parameters

    TypeError: createSequelizeInstance is not a function

      77 |   test('should create Sequelize instance with correct parameters', () => {
      78 |     const { createSequelizeInstance } = require('../../src/utils/database');
    > 79 |     createSequelizeInstance();
         |     ^
      80 |
      81 |     expect(Sequelize).toHaveBeenCalledWith(
      82 |       'test_db',

      at Object.createSequelizeInstance (__tests__/utils/database.test.js:79:5)

  ● Database Utility › should test database connection on load

    TypeError: createSequelizeInstance is not a function

      93 |   test('should test database connection on load', async () => {
      94 |     const { createSequelizeInstance, testConnection } = require('../../src/utils/database');
    > 95 |     const sequelize = createSequelizeInstance();
         |                       ^
      96 |
      97 |     await testConnection(sequelize);
      98 |

      at Object.createSequelizeInstance (__tests__/utils/database.test.js:95:23)

  ● Database Utility › should handle successful authentication

    TypeError: createSequelizeInstance is not a function

      102 |   test('should handle successful authentication', async () => {
      103 |     const { createSequelizeInstance, testConnection } = require('../../src/utils/database');
    > 104 |     const sequelize = createSequelizeInstance();
          |                       ^
      105 |
      106 |     await testConnection(sequelize);
      107 |

      at Object.createSequelizeInstance (__tests__/utils/database.test.js:104:23)

  ● Database Utility › should exit process on authentication failure

    TypeError: createSequelizeInstance is not a function

      113 |   test('should exit process on authentication failure', async () => {
      114 |     const { createSequelizeInstance, testConnection } = require('../../src/utils/database');
    > 115 |     const sequelize = createSequelizeInstance();
          |                       ^
      116 |     sequelize.authenticate.mockRejectedValue(new Error('Auth failed'));
      117 |
      118 |     await testConnection(sequelize);

      at Object.createSequelizeInstance (__tests__/utils/database.test.js:115:23)

  ● Database Utility › should use environment-specific logging settings

    TypeError: createSequelizeInstance is not a function

      147 |     jest.resetModules();
      148 |     const { createSequelizeInstance } = require('../../src/utils/database');
    > 149 |     createSequelizeInstance();
          |     ^
      150 |
      151 |     expect(Sequelize).toHaveBeenLastCalledWith(
      152 |       expect.anything(),

      at Object.createSequelizeInstance (__tests__/utils/database.test.js:149:5)

  ● Database Utility › should initialize models correctly

    expect(received).toBeDefined()

    Received: undefined

      174 |   test('should initialize models correctly', () => {
      175 |     expect(sequelize.define).toHaveBeenCalled();
    > 176 |     expect(db.Player).toBeDefined();
          |                       ^
      177 |     expect(db.Team).toBeDefined();
      178 |   });
      179 |

      at Object.toBeDefined (__tests__/utils/database.test.js:176:23)

  ● Database Utility › should set up associations correctly

    TypeError: Cannot read properties of undefined (reading 'hasMany')

      179 |
      180 |   test('should set up associations correctly', () => {
    > 181 |     expect(db.Team.hasMany).toHaveBeenCalledWith(db.Player, {
          |                    ^
      182 |       foreignKey: 'team_abbreviation',
      183 |       sourceKey: 'team_abbreviation'
      184 |     });

      at Object.hasMany (__tests__/utils/database.test.js:181:20)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

  console.log
    Rate limiting: waiting 2000ms before next request

      at LiquipediaService.log [as respectRateLimit] (src/services/liquipedia.service.js:34:15)

  console.error
    Error getting player earnings from https://liquipedia.net/valorant/TenZ: TypeError: $ is not a function
        at LiquipediaService.$ [as getPlayerEarnings] (A:\moneyball\src\services\liquipedia.service.js:127:35)
        at Object.<anonymous> (A:\moneyball\__tests__\services\liquipedia.service.test.js:140:24)

      184 |       return earnings;
      185 |     } catch (error) {
    > 186 |       console.error(`Error getting player earnings from ${playerUrl}:`, error);
          |               ^
      187 |       return null;
      188 |     }
      189 |   }

      at LiquipediaService.error [as getPlayerEarnings] (src/services/liquipedia.service.js:186:15)
      at Object.<anonymous> (__tests__/services/liquipedia.service.test.js:140:24)

  console.log
    Processing earnings for player: TenZ

      at LiquipediaService.log [as processPlayerEarnings] (src/services/liquipedia.service.js:233:15)

  console.error
    Error queuing earnings updates: TypeError: Cannot read properties of undefined (reading 'in')
        at LiquipediaService.in [as queueEarningsUpdates] (A:\moneyball\src\services\liquipedia.service.js:291:27)
        at Object.queueEarningsUpdates (A:\moneyball\__tests__\services\liquipedia.service.test.js:232:46)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusTest (A:\moneyball\node_modules\jest-circus\build\run.js:316:40)
        at _runTest (A:\moneyball\node_modules\jest-circus\build\run.js:252:3)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:126:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

      336 |       };
      337 |     } catch (error) {
    > 338 |       console.error('Error queuing earnings updates:', error);
          |               ^
      339 |       return { success: false, error: error.message };
      340 |     }
      341 |   }

      at LiquipediaService.error [as queueEarningsUpdates] (src/services/liquipedia.service.js:338:15)
      at Object.queueEarningsUpdates (__tests__/services/liquipedia.service.test.js:232:46)

  console.error
    Error processing earnings for player non-existent-id: Error: Player not found: non-existent-id
        at LiquipediaService.processPlayerEarnings (A:\moneyball\src\services\liquipedia.service.js:230:15)
        at Object.<anonymous> (A:\moneyball\__tests__\services\liquipedia.service.test.js:271:22)

      265 |       };
      266 |     } catch (error) {
    > 267 |       console.error(`Error processing earnings for player ${playerId}:`, error);
          |               ^
      268 |       return { success: false, error: error.message };
      269 |     }
      270 |   }

      at LiquipediaService.error [as processPlayerEarnings] (src/services/liquipedia.service.js:267:15)
      at Object.<anonymous> (__tests__/services/liquipedia.service.test.js:271:22)

 FAIL  __tests__/services/liquipedia.service.test.js
  LiquipediaService
    Rate Limiting
      √ respectRateLimit should enforce rate limits based on last request time (7 ms)
    API Interaction
      √ makeRequest should send a GET request with the correct headers (2 ms)
      √ searchPlayer should find and return player results (2 ms)
    Earnings Data
      × getPlayerEarnings should extract earnings data from a player page (27 ms)
      √ updatePlayerEarnings should save earnings data to the database (2 ms)
      √ processPlayerEarnings should search for player, get earnings, and update database (4 ms)
    Queue Management
      × queueEarningsUpdates should find players and add them to the queue (12 ms)
    Error Handling
      √ processPlayerEarnings should handle player not found (8 ms)
      × searchPlayer should handle search failure gracefully (4 ms)
      × updatePlayerEarnings should handle database errors (2 ms)

  ● LiquipediaService › Earnings Data › getPlayerEarnings should extract earnings data from a player page

    expect(received).toHaveProperty(path, value)

    Matcher error: received value must not be null nor undefined

    Received has value: null

      142 |       // Verify
      143 |       expect(axios.get).toHaveBeenCalled();
    > 144 |       expect(earnings).toHaveProperty('total', 50000);
          |                        ^
      145 |       expect(earnings).toHaveProperty('by_year');
      146 |       expect(earnings.by_year).toHaveProperty('2023', 30000);
      147 |       expect(earnings.by_year).toHaveProperty('2024', 20000);

      at Object.toHaveProperty (__tests__/services/liquipedia.service.test.js:144:24)

  ● LiquipediaService › Queue Management › queueEarningsUpdates should find players and add them to the queue

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"limit": 10, "where": ObjectContaining {"division": {"in": ["T1", "T2"]}}}

    Number of calls: 0

      237 |
      238 |       // Verify
    > 239 |       expect(db.Player.findAll).toHaveBeenCalledWith(expect.objectContaining({
          |                                 ^
      240 |         where: expect.objectContaining({
      241 |           division: { [db.Sequelize.Op.in]: ['T1', 'T2'] }
      242 |         }),

      at Object.toHaveBeenCalledWith (__tests__/services/liquipedia.service.test.js:239:33)

  ● LiquipediaService › Error Handling › searchPlayer should handle search failure gracefully

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 6

    - Array []
    + Array [
    +   Object {
    +     "title": "TenZ",
    +     "url": "https://liquipedia.net/valorant/TenZ",
    +   },
    + ]

      286 |
      287 |       // Verify
    > 288 |       expect(results).toEqual([]);
          |                       ^
      289 |     });
      290 |
      291 |     test('updatePlayerEarnings should handle database errors', async () => {

      at Object.toEqual (__tests__/services/liquipedia.service.test.js:288:23)

  ● LiquipediaService › Error Handling › updatePlayerEarnings should handle database errors

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      297 |
      298 |       // Verify
    > 299 |       expect(result).toBe(false);
          |                      ^
      300 |     });
      301 |   });
      302 | });

      at Object.toBe (__tests__/services/liquipedia.service.test.js:299:22)

  console.log
    Queue processor started

      at ScraperScheduler.log [as startQueueProcessor] (src/services/scheduler.service.js:160:13)

  console.log
    Scraper scheduler initialized

      at ScraperScheduler.log [as init] (src/services/scheduler.service.js:36:13)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

  console.error
    Error clearing database: TypeError: Cannot read properties of undefined (reading 'destroy')
        at destroy (A:\moneyball\__tests__\helpers\teardown.js:7:21)
        at Object.clearDatabase (A:\moneyball\__tests__\routes\analysis.routes.test.js:28:11)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusHook (A:\moneyball\node_modules\jest-circus\build\run.js:281:40)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:154:7)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

       9 |     console.log('Database cleared successfully');
      10 |   } catch (error) {
    > 11 |     console.error('Error clearing database:', error);
         |             ^
      12 |   }
      13 | }
      14 |

      at error (__tests__/helpers/teardown.js:11:13)
      at Object.clearDatabase (__tests__/routes/analysis.routes.test.js:28:11)

  console.log
    Test database connection closed

      at Object.log (__tests__/helpers/teardown.js:32:13)


  ●  Cannot log after tests are done. Did you forget to wait for something async in your test?
    Attempted to log "Server is running on port 3000".

      45 | // Start server
      46 | app.listen(PORT, async () => {
    > 47 |   console.log(`Server is running on port ${PORT}`);
         |           ^
      48 |
      49 |   // Sync database models
      50 |   try {

      at console.log (node_modules/@jest/console/build/CustomConsole.js:141:10)
      at Server.log (src/app.js:47:11)

  console.error
    Failed to sync database: TypeError: Cannot read properties of undefined (reading 'sync')
        at Server.<anonymous> (A:\moneyball\src\app.js:52:24)
        at Object.onceWrapper (node:events:632:28)
        at Server.emit (node:events:530:35)
        at emitListeningNT (node:net:1931:10)
        at processTicksAndRejections (node:internal/process/task_queues:81:21)

      52 |     console.log('Database synchronized successfully');
      53 |   } catch (error) {
    > 54 |     console.error('Failed to sync database:', error);
         |             ^
      55 |   }
      56 | });
      57 |

      at Server.error (src/app.js:54:13)

 FAIL  __tests__/routes/analysis.routes.test.js (5.95 s)
  Analysis API Endpoints
    GET /api/analysis/players/similar/:player_id
      × should return similar players
      × should filter similar players by free agent status
      × should return 404 for non-existent player
    GET /api/analysis/market/free-agents
      × should return free agent market analysis
      × should filter market analysis by role
      × should filter market analysis by min_rating
    GET /api/analysis/roster/generate
      × should generate an optimal roster
      × should respect budget constraints
      × should optimize roster for specified strategy
    GET /api/analysis/players/compare
      × should compare multiple players
      × should return 400 for missing player_ids
      × should return 404 for non-existent players
    GET /api/analysis/players/valuation/:player_id
      × should return player valuation details
      × should return 404 for non-existent player

  ● Analysis API Endpoints › GET /api/analysis/players/similar/:player_id › should return similar players

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/players/similar/:player_id › should filter similar players by free agent status

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/players/similar/:player_id › should return 404 for non-existent player

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/market/free-agents › should return free agent market analysis

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/market/free-agents › should filter market analysis by role

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/market/free-agents › should filter market analysis by min_rating

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/roster/generate › should generate an optimal roster

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/roster/generate › should respect budget constraints

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/roster/generate › should optimize roster for specified strategy

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/players/compare › should compare multiple players

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/players/compare › should return 400 for missing player_ids

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/players/compare › should return 404 for non-existent players

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/players/valuation/:player_id › should return player valuation details

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  ● Analysis API Endpoints › GET /api/analysis/players/valuation/:player_id › should return 404 for non-existent player

    TypeError: Cannot read properties of undefined (reading 'sync')

       9 |   beforeAll(async () => {
      10 |     // Sync the model with the database
    > 11 |     await db.sequelize.sync({ force: true });
         |                        ^
      12 |   });
      13 |
      14 |   beforeEach(async () => {

      at Object.sync (__tests__/routes/analysis.routes.test.js:11:24)

  console.log
    Queue processor started

      at ScraperScheduler.log [as startQueueProcessor] (src/services/scheduler.service.js:160:13)

  console.log
    Scraper scheduler initialized

      at ScraperScheduler.log [as init] (src/services/scheduler.service.js:36:13)

  console.log
    Test database connection established

      at Object.log (__tests__/helpers/setup.js:25:13)

  console.error
    Error clearing database: TypeError: Cannot read properties of undefined (reading 'destroy')
        at destroy (A:\moneyball\__tests__\helpers\teardown.js:7:21)
        at Object.clearDatabase (A:\moneyball\__tests__\routes\team.routes.test.js:23:11)
        at Promise.then.completed (A:\moneyball\node_modules\jest-circus\build\utils.js:298:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (A:\moneyball\node_modules\jest-circus\build\utils.js:231:10)
        at _callCircusHook (A:\moneyball\node_modules\jest-circus\build\run.js:281:40)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:154:7)
        at _runTestsForDescribeBlock (A:\moneyball\node_modules\jest-circus\build\run.js:121:9)
        at run (A:\moneyball\node_modules\jest-circus\build\run.js:71:3)
        at runAndTransformResultsToJestFormat (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:122:21)
        at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:19)
        at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
        at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)

       9 |     console.log('Database cleared successfully');
      10 |   } catch (error) {
    > 11 |     console.error('Error clearing database:', error);
         |             ^
      12 |   }
      13 | }
      14 |

      at error (__tests__/helpers/teardown.js:11:13)
      at Object.clearDatabase (__tests__/routes/team.routes.test.js:23:11)

  console.log
    Test database connection closed

      at Object.log (__tests__/helpers/teardown.js:32:13)


 RUNS  __tests__/routes/team.routes.test.js
node:events:496
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1897:16)
    at listenInCluster (node:net:1945:12)
    at Server.listen (node:net:2037:7)
    at Function.listen (A:\moneyball\node_modules\express\lib\application.js:635:24)
    at Object.listen (A:\moneyball\src\app.js:46:5)
    at Runtime._execModule (A:\moneyball\node_modules\jest-runtime\build\index.js:1439:24)
    at Runtime._loadModule (A:\moneyball\node_modules\jest-runtime\build\index.js:1022:12)
    at Runtime.requireModule (A:\moneyball\node_modules\jest-runtime\build\index.js:882:12)
    at Runtime.requireModuleOrMock (A:\moneyball\node_modules\jest-runtime\build\index.js:1048:21)
    at Object.require (A:\moneyball\__tests__\routes\team.routes.test.js:3:13)
    at Runtime._execModule (A:\moneyball\node_modules\jest-runtime\build\index.js:1439:24)
    at Runtime._loadModule (A:\moneyball\node_modules\jest-runtime\build\index.js:1022:12)
    at Runtime.requireModule (A:\moneyball\node_modules\jest-runtime\build\index.js:882:12)
    at jestAdapter (A:\moneyball\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:77:13)
    at runTestInternal (A:\moneyball\node_modules\jest-runner\build\runTest.js:367:16)
    at runTest (A:\moneyball\node_modules\jest-runner\build\runTest.js:444:34)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1924:8)
    at processTicksAndRejections (node:internal/process/task_queues:82:21) {
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '::',
  port: 3000
}

Node.js v20.12.1