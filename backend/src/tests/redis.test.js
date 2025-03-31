const Redis = require('ioredis');

async function testRedisConnection() {
  const redis = new Redis({
    host: '172.24.18.79',
    port: 6379,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  try {
    // Test basic connection
    console.log('Testing Redis connection...');
    const pingResult = await redis.ping();
    console.log('Ping result:', pingResult);

    // Test setting and getting a value
    console.log('\nTesting set/get operations...');
    await redis.set('test:key', 'Hello Redis!');
    const value = await redis.get('test:key');
    console.log('Get result:', value);

    // Test setting with expiration
    console.log('\nTesting expiration...');
    await redis.setex('test:expire', 5, 'This will expire in 5 seconds');
    const beforeExpire = await redis.get('test:expire');
    console.log('Before expiration:', beforeExpire);

    // Wait 6 seconds
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Check if expired
    const afterExpire = await redis.get('test:expire');
    console.log('After expiration:', afterExpire);

    console.log('\nRedis connection test completed successfully!');
  } catch (error) {
    console.error('Redis connection test failed:', error);
  } finally {
    await redis.quit();
  }
}

// Run the test
testRedisConnection(); 