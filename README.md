# Moneyball

## Esports Analytics Platform
### Project Description

Project Moneyball is an esports analytics tool that will help Valorant players (for now) that are `free-agents` become marketable towards new organizations that want to enter into the Valorant competitive scene AND help existing organizations build better roster depth.

As an org owner BLVKHVND (playing in Game Changers EMEA) I've been messaged countless times by players looking for a spot on our roster and I have always been sad to turn them away nor provide them an alternative. With Moneyball, free agents can have stronger visibility to orgs looking to break into Valorant as well as find other compatible players to compete in all of the open qualifiers from T2/T3 spaces.

The product is designed to aggregate player data and trends within the free agent space to help orgs analyze the types of playstyles they want for their roster builds. They can also do a mock roster draft to see how players might complement each other. On the free agent side, players can opt into sharing their competitive data to learn of their value if they are to be recruited.

Within the regions and markets of Valorant, I have been able to accrue industry knowledge on the salary range of players and my goal is to make that information more transparent so that players know their worth, can negotiate with orgs better AND that new orgs understand the true cost of entering in the competitive space so that they are less likely to participate short term and fizzle out when their funds dry up.

<aside>
The goal is after disrupting the Valorant scene, we can expand to all popular and emerging titles, predict what the player scene can look like, and the earning potential of brands, orgs, and players alike. 
</aside>

## Notes
I am working through a database (I was using python, switched to an all js setup with postgres) and setting up API endpoints alongside a scraper to build up the datasets. Once I finish with that, then I'll work on more of the interpretation of the data, and design a simple UI for the MVP. Afterward, some frontend will need to be built. I am attempting to code this thing with a mix of tools and shit ton of tutorials. I'm already refactoring some of it because trying to test the APIs is becoming a bigger issue than me trying to just test with the real stuff lmfao. Anyway, my goal is to launch this in some capacity by the 25th as we have some orgs wanting to see if its good. It should be, it's how we've recruited players in the past...now we can charge for it lol.

### Setup
1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` to start development server

### Technologies
- Express.js
- Sequelize
- SQLite
