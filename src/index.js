const ClothingAgent = require('./agents/ClothingAgent');
const clothesData = require('./data/clothes.json');

// create agent instances for all clothes
const agents = clothesData.map(c => new ClothingAgent(c));

console.log('Starting agent simulation...\n');

setInterval(() => {
  agents.forEach(agent => agent.tick(agents));
}, 2000); // tick every 2 seconds
