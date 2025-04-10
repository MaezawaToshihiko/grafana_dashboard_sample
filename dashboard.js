/*
 * This script manages the creation and deletion of dashboards within the Grafana workspace.
 *
 * It requires the following environment variables to be set:
 * - GRAFANA_WORKSPACE: The name of the Grafana workspace
 * - GRAFANA_API_KEY: The API key for the Grafana workspace
 * 
 * Disclaimer: Sample Program for Demonstration Purposes
 *   This script is not intended for production use.
 *   This sample program demonstrates the creation and deletion of a Grafana dashboard.
 *   It is provided "as is" without warranty of any kind, express or implied.
 *   Please use this program at your own risk. The authors and "iJbridge.inc" take no responsibility 
 *   for any damage or issues caused by using this code.
 * 
 *   Copyright (c) 2024 iJbridge.inc. All rights reserved.
 */

// Import required modules
const axios = require('axios');
const moment = require('moment');
const crypto = require('crypto');

// Workspace and API key is required to create and delete dashboard
const WORKSPACE = process.env.GRAFANA_WORKSPACE || 'jrcrmtctl-graph-ekdgh0f5emfdc0bz.tyo.grafana.azure.com';
const API_KEY = process.env.GRAFANA_API_KEY || 'glsa_itotCC5pq9KQr2FpZIsAESG13Fyy9ko0_4be0cec4';
// const API_KEY = process.env.GRAFANA_API_KEY || 'glsa_gqFfSmkT7hqUm5coHS7dehuyPTzDRiKR_fdc7aa19';

// const WORKSPACE = process.env.GRAFANA_WORKSPACE || '4.216.217.72:3000';
// const API_KEY = process.env.GRAFANA_API_KEY || 'glsa_zo0OEjfxxH4BSq1mTuCI70TWXIamagUV_4eea92c9';

// Grafana API client class definition
class AzureGrafanaAPIClient {
  constructor(workspaceEndpoint, apiKey) {
    workspaceEndpoint = workspaceEndpoint.replace('https://', '').replace('http://', '').replace(/\/$/, '');
    this.baseUrl = `https://${workspaceEndpoint}`;

    // Set headers for the API request. This operation requires a Grafana API key
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Create an axios client
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: this.headers,
      timeout: 5000, // 5 seconds timeout
      maxRedirects: 5, // follow up to 5 redirects
    });

    // Retry on failure (retry mechanism)
    this.client.interceptors.response.use(null, async (error) => {
      const config = error.config;
      if (!config || !config.retry) return Promise.reject(error);
      config.retry -= 1;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Retry after 1 second
      return this.client(config);
    });
  }
  // Generate a unique UID
  generateUniqueUid(title) {
    const uniqueString = `${title}-${moment().toISOString()}-${crypto.randomUUID()}`;
    return crypto.createHash('sha256').update(uniqueString).digest('hex').slice(0, 12);
  }

  // Method to handle Grafana API requests
  async makeRequest(method, endpoint, data = {}) {
    try {
      const response = await this.client.request({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data
      });
      return response.data;
    } catch (error) {
      console.error(`HTTP Error: ${error.message}`);
      if (error.response) {
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  // Create a new Grafana dashboard
  async createDashboard(title, panels = [], folderId = null, uid = null) {
    const uniqueUid = this.generateUniqueUid(title);
    const dashboard = {
      dashboard: {
        id: null,
        uid: uid == null? uniqueUid: uid,
        title: title,
        tags: ['generated'],
        timezone: 'browser',
        schemaVersion: 36,
        version: 0,
        panels: panels,
        editable: true,
        time: {
          from: 'now-6h',
          to: 'now',
        },
        refresh: '5s',
      },
      message: `Dashboard created at ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
      overwrite: true,
    };

    if (folderId !== null) {
      dashboard.folderId = folderId;
    }

    return this.makeRequest('POST', '/api/dashboards/db', dashboard);
  }

  // Delete a Grafana dashboard
  async deleteDashboard(uid) {
    return this.makeRequest('DELETE', `/api/dashboards/uid/${uid}`);
  }

  // delete dashboards by title pattern
  async deleteDashboardsByTitlePattern(pattern) {
    const dashboards = await this.searchDashboards(pattern);
    const results = [];

    for (const dashboard of dashboards) {
      try {
        const result = await this.deleteDashboard(dashboard.uid);
        results.push({
          title: dashboard.title,
          uid: dashboard.uid,
          status: 'deleted',
          response: result,
        });
        console.log(`Successfully deleted dashboard: ${dashboard.title} (UID: ${dashboard.uid})`);
      } catch (error) {
        results.push({
          title: dashboard.title,
          uid: dashboard.uid,
          status: 'error',
          error: error.message,
        });
        console.log(`Failed to delete dashboard: ${dashboard.title} (UID: ${dashboard.uid}) - Error: ${error.message}`);
      }
    }

    return results;
  }

  // Create a sample Grafana dashboard
  async createSampleDashboard(title = null) {
    if (!title) {
      // title = `Sample Dashboard ${moment().format('YYYYMMDD-HHmmss')}`;
      title = `TestDashboard ${moment().format('YYYYMMDD-HHmmss')}`;
    }

    // Dashboard JSON model panel example. 
    // Replace this with a desired JSON model.
    const panels = [
      {
        id: 1,
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
        title: 'Sample Metric',
        type: 'stat',
        targets: [
          {
            refId: 'A',
            datasource: { type: 'prometheus', uid: 'prometheus' },
            expr: 'up{}',
          },
        ],
      },
      {
        id: 2,
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
        title: 'Sample Graph',
        type: 'timeseries',
        targets: [
          {
            refId: 'A',
            datasource: { type: 'prometheus', uid: 'prometheus' },
            expr: 'rate(node_cpu_seconds_total{mode="system"}[5m])',
          },
        ],
      },
    ];

    return this.createDashboard(title, panels);
  }

  async missingNumber(numbers, base) {
    let num = base;
    for (let number of numbers) {
      if (number != num) {
        break;
      }
      num++;
    }
    return num;
  }

  // Update a sample Grafana dashboard
  async updateSampleDashboard(uid, dash) {
    // Dashboard JSON model panel example. 
    // Replace this with a desired JSON model.
    let ids = dash.panels.map((panel) => panel.id).sort();
    console.log('panels = ', ids);
    let new_id = await this.missingNumber(ids, 1);

    dash.panels = [];
    dash.panels.push(
      {
        id: new_id,
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
        title: 'Sample Metric' + new_id,
        type: 'timeseries',
        targets: [
          {
            refId: 'A' + new_id,
            datasource: { type: 'prometheus', uid: 'prometheus' },
            expr: 'rate(node_cpu_seconds_total{mode="system"}[5m])',
          },
        ],
      },
    );

    return this.createDashboard(dash.title, dash.panels, null, dash.uid);
  }

  /**
   * Retrieve a dashboard by its unique identifier (UID).
   *
   * @param {string} uid - The unique identifier of the dashboard to retrieve.
   * @returns {Promise<Object>} A promise that resolves to the dashboard data.
   */
  async getDashboardByUID(uid) {
    return this.makeRequest('GET', `/api/dashboards/uid/${uid}`);
  }

  async getSettings() {
    return this.makeRequest('GET', `/api/admin/settings`);
  }
}

const readline = require('readline');

// Create a readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask a question and wait for user input
function askQuestion(query) {
  rl.resume();  // Resumes input from the terminal
  return new Promise(resolve => rl.question(query, answer => {
    rl.pause();  // Pauses input after receiving the answer
    resolve(answer);
  }));
}

// Main function that handles user interaction
async function main() {
  const client = new AzureGrafanaAPIClient(WORKSPACE, API_KEY);

  let exit = false; // Flag to control exit

  // Main menu loop
  while (!exit) {
    console.log("\n=== Grafana Dashboard Manager ===");
    console.log("1. Create Sample Dashboard");
    console.log("2. Delete Dashboard by UID");
    console.log("3. Display Dashboard Info");
    console.log("4. Update Sample Dashboard");
    console.log("0. Exit");
    console.log("==============================");

    // Ask user for their choice
    const choice = await askQuestion("\nEnter your choice (1-4): ");
    let infoUid = null;
    let uid = null;

    // Handle different cases based on user choice
    switch (choice) {
      // Create a sample dashboard
    case '1':
      console.log('Creating Sample Dashboard...');
      try {
        const result = await client.createSampleDashboard();
        console.log(`Dashboard created with UID: ${result.uid}`);
      } catch (error) {
        console.error("Error creating dashboard:", error.message);
      }
      break;

      // Delete a dashboard
    case '2':
      uid = await askQuestion("Enter dashboard UID: ");
      try {
        await client.deleteDashboard(uid);
        console.log(`Dashboard with UID ${uid} deleted successfully.`);
      } catch (error) {
        console.error("Error deleting dashboard:", error.message);
      }
      break;

      // Display dashboard info
    case '3':
      infoUid = await askQuestion("Enter dashboard UID: ");
      try {
        const dashboardInfo = await client.getDashboardByUID(infoUid);
        console.log("Dashboard Info:", dashboardInfo);
        console.log("Dashboard Info:", dashboardInfo.dashboard);
        console.log("Panels Info   :", dashboardInfo.dashboard.panels);
      } catch (error) {
        console.error("Error retrieving dashboard info:", error.message);
      }
      break;

      // Update dashboard
    case '4':
      infoUid = await askQuestion("Enter dashboard UID: ");
      console.log('Updating Sample Dashboard...');
      try {
        const dashboardInfo = await client.getDashboardByUID(infoUid);
        const result = await client.updateSampleDashboard(infoUid, dashboardInfo.dashboard);
        console.log(`Dashboard updated with UID: ${result.uid}`);
      } catch (error) {
        console.error("Error creating dashboard:", error.message);
      }
      try {
        const dashboardInfo = await client.getDashboardByUID(infoUid);
        console.log("Dashboard Info:", dashboardInfo);
      } catch (error) {
        console.error("Error retrieving dashboard info:", error.message);
      }
      break;

      // Display dashboard info
    case '5':
      try {
        const settings = await client.getSettings();
        console.log(settings);
      } catch (error) {
        console.error("Error retrieving setting:", error.message);
      }
      break;

      // Exit the loop and quit the program
    case '0':
      console.log('Exiting...');
      exit = true;  // Set exit flag to true to end the loop
      break;

    default:
      console.log('Invalid choice! Please enter a number between 1 and 6.');
    }
  }

  // Close the readline interface when the user chooses to exit
  rl.close();
}

// Start the program
main();
