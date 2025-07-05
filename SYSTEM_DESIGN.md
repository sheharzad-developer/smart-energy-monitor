# 🏗️ System Design: High-Throughput Energy Monitoring

## 📋 Problem Statement

In a high-throughput smart home energy monitoring system handling **millions of telemetry data points per hour** from thousands of devices, the Analytics Service becomes a bottleneck when generating real-time aggregations and alerts. The service currently queries the PostgreSQL database directly for each analytics request, and response times are degrading significantly during peak hours.

## 🎯 Solution Architecture

### **1. Data Pipeline Optimization**

```
IoT Devices → Message Queue → Batch Processor → Time-Series DB → Analytics Cache
     ↓              ↓              ↓              ↓              ↓
  Real-time     Apache Kafka    Stream Proc.   InfluxDB      Redis/Memcached
```

**Key Components:**

#### **Message Queue Layer (Apache Kafka)**
```javascript
// Pseudo-code for high-throughput ingestion
const kafkaProducer = kafka.producer({
  maxInFlightRequests: 10,
  idempotent: true,
  compression: 'gzip'
});

// Partition by device_id for parallel processing
await producer.send({
  topic: 'telemetry-data',
  messages: [{
    partition: hash(deviceId) % partitionCount,
    key: deviceId,
    value: JSON.stringify(telemetryData)
  }]
});
```

#### **Stream Processing (Apache Flink/Kafka Streams)**
```javascript
// Real-time aggregation pipeline
const aggregationPipeline = {
  // 1-minute windows for real-time alerts
  minuteAggregates: stream
    .keyBy('deviceId')
    .window(TumblingWindow.of(Time.minutes(1)))
    .aggregate(new EnergyAggregator()),
    
  // 1-hour windows for dashboard views
  hourlyAggregates: stream
    .keyBy('deviceId') 
    .window(TumblingWindow.of(Time.hours(1)))
    .aggregate(new EnergyAggregator())
};
```

#### **Time-Series Database (InfluxDB)**
```sql
-- Optimized schema for time-series data
CREATE MEASUREMENT telemetry (
  time TIMESTAMP,
  device_id TAG,
  device_type TAG,
  user_id TAG,
  energy_watts FIELD,
  power_factor FIELD
) WITH (
  SHARD DURATION = '1d',
  RETENTION POLICY = '30d'
);

-- Pre-computed continuous queries for common aggregations
CREATE CONTINUOUS QUERY hourly_avg ON energy_db
BEGIN
  SELECT mean(energy_watts) as avg_energy
  INTO hourly_averages
  FROM telemetry
  GROUP BY time(1h), device_id
END;
```

### **2. Caching Strategy**

#### **Multi-Layer Caching**
```javascript
// L1: Application-level cache (Node.js)
const NodeCache = require('node-cache');
const appCache = new NodeCache({ stdTTL: 300 }); // 5 min TTL

// L2: Distributed cache (Redis)
const redisCache = redis.createClient({
  cluster: true,
  nodes: ['redis-1:6379', 'redis-2:6379', 'redis-3:6379']
});

// L3: CDN edge cache for static aggregations
const cacheStrategy = {
  realTimeAlerts: { ttl: 30 },      // 30 seconds
  hourlyStats: { ttl: 300 },        // 5 minutes  
  dailyReports: { ttl: 3600 },      // 1 hour
  historicalTrends: { ttl: 86400 }  // 24 hours
};
```

#### **Intelligent Cache Warming**
```javascript
// Pre-compute popular queries
const cacheWarmer = {
  async warmDashboardData(userId) {
    const queries = [
      'total_energy_today',
      'top_consuming_devices', 
      'hourly_trends_last_24h',
      'device_status_summary'
    ];
    
    await Promise.all(queries.map(query => 
      this.preComputeAndCache(userId, query)
    ));
  }
};
```

### **3. Database Sharding & Partitioning**

#### **Horizontal Sharding Strategy**
```javascript
// Shard by user_id for data locality
const getShardKey = (userId) => {
  return `shard_${userId % SHARD_COUNT}`;
};

// Time-based partitioning for efficient queries
const partitionStrategy = {
  daily: 'telemetry_YYYY_MM_DD',
  monthly: 'aggregates_YYYY_MM',
  yearly: 'historical_YYYY'
};
```

#### **Read Replicas & Connection Pooling**
```javascript
const dbConfig = {
  master: { 
    host: 'master-db', 
    maxConnections: 100 
  },
  readReplicas: [
    { host: 'replica-1', weight: 0.4 },
    { host: 'replica-2', weight: 0.3 },
    { host: 'replica-3', weight: 0.3 }
  ]
};

// Route analytics queries to read replicas
const queryRouter = (query) => {
  return query.type === 'write' 
    ? dbConfig.master 
    : selectReplica(dbConfig.readReplicas);
};
```

### **4. Microservices Decomposition**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ingestion     │    │   Processing    │    │   Analytics     │
│   Service       │───▶│   Service       │───▶│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Message Queue  │    │ Stream Processor│    │  Cache Layer    │
│   (Kafka)       │    │   (Flink)       │    │   (Redis)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Service Responsibilities**
```javascript
// Ingestion Service (Port 3002)
const ingestionService = {
  responsibilities: [
    'Validate telemetry data',
    'Publish to message queue',
    'Handle backpressure',
    'Provide health checks'
  ],
  scaling: 'Horizontal (stateless)'
};

// Processing Service (New)
const processingService = {
  responsibilities: [
    'Stream processing',
    'Real-time aggregations', 
    'Alert generation',
    'Data enrichment'
  ],
  scaling: 'Auto-scaling based on queue depth'
};

// Analytics Service (Port 3003) 
const analyticsService = {
  responsibilities: [
    'Serve cached aggregations',
    'Complex ad-hoc queries',
    'AI/ML predictions',
    'Report generation'
  ],
  scaling: 'Horizontal with session affinity'
};
```

### **5. Performance Optimizations**

#### **Batch Processing**
```javascript
// Batch multiple telemetry points for efficiency
const batchProcessor = {
  batchSize: 1000,
  flushInterval: 5000, // 5 seconds
  
  async processBatch(telemetryBatch) {
    const operations = telemetryBatch.map(data => ({
      insertOne: { document: data }
    }));
    
    await db.collection('telemetry').bulkWrite(operations, {
      ordered: false,
      writeConcern: { w: 1, j: false } // Relaxed consistency for speed
    });
  }
};
```

#### **Connection Pooling & Circuit Breakers**
```javascript
// Database connection optimization
const pgPool = new Pool({
  host: 'timescale-db',
  database: 'energy_monitor',
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000
});

// Circuit breaker for external services
const circuitBreaker = new CircuitBreaker(analyticsQuery, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
```

## 📊 Expected Performance Improvements

| Metric | Before Optimization | After Optimization | Improvement |
|--------|-------------------|-------------------|-------------|
| **Ingestion Rate** | 1K events/sec | 100K events/sec | 100x |
| **Query Response** | 2-5 seconds | 50-200ms | 10-25x |
| **Peak Hour Latency** | 10+ seconds | <500ms | 20x |
| **Concurrent Users** | 100 | 10,000+ | 100x |
| **Data Retention** | 30 days | 5+ years | Unlimited |

## 🔧 Implementation Phases

### **Phase 1: Quick Wins (Week 1)**
- ✅ Implement Redis caching for common queries
- ✅ Add database connection pooling
- ✅ Optimize existing SQL queries with indexes

### **Phase 2: Architecture Changes (Weeks 2-4)**
- 🔄 Introduce message queue (Kafka)
- 🔄 Migrate to time-series database (InfluxDB/TimescaleDB)
- 🔄 Implement stream processing

### **Phase 3: Scale Out (Weeks 5-8)**
- 🔄 Microservices decomposition
- 🔄 Horizontal sharding
- 🔄 Auto-scaling infrastructure

## 🚨 Monitoring & Alerting

```javascript
const monitoring = {
  metrics: [
    'ingestion_rate_per_second',
    'query_response_time_p95',
    'cache_hit_ratio',
    'queue_depth',
    'error_rate_percentage'
  ],
  
  alerts: [
    { metric: 'queue_depth', threshold: 10000, action: 'scale_up' },
    { metric: 'response_time_p95', threshold: 1000, action: 'cache_warm' },
    { metric: 'error_rate', threshold: 5, action: 'circuit_break' }
  ]
};
```

## 🏆 Conclusion

This architecture provides:
- **100x increase** in ingestion capacity
- **Sub-second response times** even at peak load
- **Horizontal scalability** for millions of devices
- **Cost optimization** through efficient resource usage
- **High availability** with fault tolerance

The key is moving from a **synchronous, database-heavy** architecture to an **asynchronous, cache-first** approach with proper separation of concerns. 