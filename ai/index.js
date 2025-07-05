const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Natural language query parser
class QueryParser {
  static parseQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Extract time period
    let timeFilter = "7 days"; // default
    if (lowerQuery.includes("yesterday")) {
      timeFilter = "1 day";
    } else if (lowerQuery.includes("today")) {
      timeFilter = "1 day";
    } else if (lowerQuery.includes("week") || lowerQuery.includes("7 days")) {
      timeFilter = "7 days";
    } else if (lowerQuery.includes("month") || lowerQuery.includes("30 days")) {
      timeFilter = "30 days";
    }

    // Extract query type
    let queryType = "summary";
    if (lowerQuery.includes("most energy") || lowerQuery.includes("highest")) {
      queryType = "highest_usage";
    } else if (lowerQuery.includes("least energy") || lowerQuery.includes("lowest")) {
      queryType = "lowest_usage";
    } else if (lowerQuery.includes("total") || lowerQuery.includes("sum")) {
      queryType = "total_usage";
    } else if (lowerQuery.includes("average") || lowerQuery.includes("avg")) {
      queryType = "average_usage";
    } else if (lowerQuery.includes("compare") || lowerQuery.includes("comparison")) {
      queryType = "comparison";
    } else if (lowerQuery.includes("trend") || lowerQuery.includes("over time")) {
      queryType = "trend";
    }

    // Extract device filter
    let deviceFilter = null;
    const deviceKeywords = ["fridge", "ac", "heater", "lights", "washing machine"];
    for (const device of deviceKeywords) {
      if (lowerQuery.includes(device)) {
        deviceFilter = device;
        break;
      }
    }

    return {
      originalQuery: query,
      timeFilter,
      queryType,
      deviceFilter
    };
  }
}

// Query executor
class QueryExecutor {
  static async executeQuery(parsedQuery) {
    const { timeFilter, queryType, deviceFilter } = parsedQuery;
    
    try {
      switch (queryType) {
        case "highest_usage":
          return await this.getHighestUsage(timeFilter, deviceFilter);
        case "lowest_usage":
          return await this.getLowestUsage(timeFilter, deviceFilter);
        case "total_usage":
          return await this.getTotalUsage(timeFilter, deviceFilter);
        case "average_usage":
          return await this.getAverageUsage(timeFilter, deviceFilter);
        case "comparison":
          return await this.getComparison(timeFilter);
        case "trend":
          return await this.getTrend(timeFilter, deviceFilter);
        default:
          return await this.getSummary(timeFilter);
      }
    } catch (error) {
      console.error("Query execution error:", error);
      throw error;
    }
  }

  static async getHighestUsage(timeFilter, deviceFilter) {
    let query = `
      SELECT 
        d.device_name,
        d.device_id,
        SUM(t.energy_watts) as total_watts,
        AVG(t.energy_watts) as avg_watts,
        COUNT(t.id) as readings_count
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
    `;
    
    if (deviceFilter) {
      query += ` AND LOWER(d.device_name) LIKE '%${deviceFilter}%'`;
    }
    
    query += `
      GROUP BY d.device_name, d.device_id
      ORDER BY total_watts DESC
      LIMIT 5
    `;

    const result = await pool.query(query);
    return {
      type: "highest_usage",
      timeFilter,
      devices: result.rows
    };
  }

  static async getLowestUsage(timeFilter, deviceFilter) {
    let query = `
      SELECT 
        d.device_name,
        d.device_id,
        SUM(t.energy_watts) as total_watts,
        AVG(t.energy_watts) as avg_watts,
        COUNT(t.id) as readings_count
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
    `;
    
    if (deviceFilter) {
      query += ` AND LOWER(d.device_name) LIKE '%${deviceFilter}%'`;
    }
    
    query += `
      GROUP BY d.device_name, d.device_id
      ORDER BY total_watts ASC
      LIMIT 5
    `;

    const result = await pool.query(query);
    return {
      type: "lowest_usage",
      timeFilter,
      devices: result.rows
    };
  }

  static async getTotalUsage(timeFilter, deviceFilter) {
    let query = `
      SELECT 
        SUM(t.energy_watts) as total_watts,
        COUNT(DISTINCT d.device_id) as device_count,
        COUNT(t.id) as total_readings
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
    `;
    
    if (deviceFilter) {
      query += ` AND LOWER(d.device_name) LIKE '%${deviceFilter}%'`;
    }

    const result = await pool.query(query);
    return {
      type: "total_usage",
      timeFilter,
      summary: result.rows[0]
    };
  }

  static async getAverageUsage(timeFilter, deviceFilter) {
    let query = `
      SELECT 
        d.device_name,
        d.device_id,
        AVG(t.energy_watts) as avg_watts,
        COUNT(t.id) as readings_count
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
    `;
    
    if (deviceFilter) {
      query += ` AND LOWER(d.device_name) LIKE '%${deviceFilter}%'`;
    }
    
    query += `
      GROUP BY d.device_name, d.device_id
      ORDER BY avg_watts DESC
    `;

    const result = await pool.query(query);
    return {
      type: "average_usage",
      timeFilter,
      devices: result.rows
    };
  }

  static async getComparison(timeFilter) {
    const query = `
      SELECT 
        d.device_name,
        d.device_id,
        SUM(t.energy_watts) as total_watts,
        AVG(t.energy_watts) as avg_watts
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
      GROUP BY d.device_name, d.device_id
      ORDER BY total_watts DESC
    `;

    const result = await pool.query(query);
    return {
      type: "comparison",
      timeFilter,
      devices: result.rows
    };
  }

  static async getTrend(timeFilter, deviceFilter) {
    let query = `
      SELECT 
        DATE_TRUNC('day', t.timestamp) as day,
        SUM(t.energy_watts) as daily_watts,
        AVG(t.energy_watts) as avg_watts,
        COUNT(t.id) as readings_count
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
    `;
    
    if (deviceFilter) {
      query += ` AND LOWER(d.device_name) LIKE '%${deviceFilter}%'`;
    }
    
    query += `
      GROUP BY DATE_TRUNC('day', t.timestamp)
      ORDER BY day DESC
    `;

    const result = await pool.query(query);
    return {
      type: "trend",
      timeFilter,
      dailyData: result.rows
    };
  }

  static async getSummary(timeFilter) {
    const overallQuery = `
      SELECT 
        SUM(t.energy_watts) as total_watts,
        AVG(t.energy_watts) as avg_watts,
        COUNT(DISTINCT d.device_id) as device_count,
        COUNT(t.id) as total_readings
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
    `;

    const deviceQuery = `
      SELECT 
        d.device_name,
        d.device_id,
        SUM(t.energy_watts) as total_watts,
        AVG(t.energy_watts) as avg_watts
      FROM telemetry t
      JOIN devices d ON t.device_id = d.device_id
      WHERE t.timestamp >= NOW() - INTERVAL '${timeFilter}'
      GROUP BY d.device_name, d.device_id
      ORDER BY total_watts DESC
      LIMIT 5
    `;

    const [overallResult, deviceResult] = await Promise.all([
      pool.query(overallQuery),
      pool.query(deviceQuery)
    ]);

    return {
      type: "summary",
      timeFilter,
      overall: overallResult.rows[0],
      topDevices: deviceResult.rows
    };
  }
}

// POST /api/chat/query - Process natural language queries
app.post('/api/chat/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Parse the natural language query
    const parsedQuery = QueryParser.parseQuery(query);
    
    // Execute the query
    const result = await QueryExecutor.executeQuery(parsedQuery);

    // Generate human-readable response
    const response = generateResponse(result, parsedQuery);

    res.json({
      originalQuery: query,
      parsedQuery,
      result,
      response
    });

  } catch (error) {
    console.error('Chat query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate human-readable response
function generateResponse(result, parsedQuery) {
  const { queryType, timeFilter } = parsedQuery;
  
  switch (queryType) {
    case "highest_usage":
      if (result.devices.length > 0) {
        const topDevice = result.devices[0];
        return `In the last ${timeFilter}, the device with the highest energy usage was "${topDevice.device_name}" with ${parseFloat(topDevice.total_watts).toFixed(2)} watts total consumption.`;
      }
      return `No data found for the last ${timeFilter}.`;
      
    case "lowest_usage":
      if (result.devices.length > 0) {
        const bottomDevice = result.devices[0];
        return `In the last ${timeFilter}, the device with the lowest energy usage was "${bottomDevice.device_name}" with ${parseFloat(bottomDevice.total_watts).toFixed(2)} watts total consumption.`;
      }
      return `No data found for the last ${timeFilter}.`;
      
    case "total_usage":
      return `Total energy consumption in the last ${timeFilter}: ${parseFloat(result.summary.total_watts).toFixed(2)} watts across ${result.summary.device_count} devices.`;
      
    case "comparison":
      if (result.devices.length > 0) {
        const deviceList = result.devices.map(d => 
          `${d.device_name}: ${parseFloat(d.total_watts).toFixed(2)}W`
        ).join(', ');
        return `Energy consumption comparison for the last ${timeFilter}: ${deviceList}`;
      }
      return `No data available for comparison in the last ${timeFilter}.`;
      
    default:
      if (result.overall && result.topDevices.length > 0) {
        const topDevice = result.topDevices[0];
        return `Energy summary for the last ${timeFilter}: Total consumption of ${parseFloat(result.overall.total_watts).toFixed(2)} watts. Top consuming device: "${topDevice.device_name}" with ${parseFloat(topDevice.total_watts).toFixed(2)} watts.`;
      }
      return `No energy data available for the last ${timeFilter}.`;
  }
}

app.get("/", (req, res) => res.send("AI service running"));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`AI service running on port ${PORT}`)); 