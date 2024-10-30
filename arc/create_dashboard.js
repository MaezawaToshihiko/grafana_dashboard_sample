const axios = require('axios');
const moment = require('moment');

class AzureGrafanaAPIClient {
    constructor(workspaceEndpoint, apiKey) {
        /**
         * Initialize Azure Managed Grafana API client
         */
        workspaceEndpoint = workspaceEndpoint.replace('https://', '').replace('http://', '').replace(/\/$/, '');
        this.baseUrl = `https://${workspaceEndpoint}`;

        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: this.headers,
            timeout: 5000, // optional, set a timeout of 5 seconds
            maxRedirects: 5 // optional, follow up to 5 redirects
        });

        this.client.interceptors.response.use(
            response => response,
            error => {
                if (error.response) {
                    console.error(`HTTP Error: ${error.response.status} - ${error.response.statusText}`);
                    console.error(`Response content: ${error.response.data}`);
                } else {
                    console.error(`Request failed: ${error.message}`);
                }
                return Promise.reject(error);
            }
        );
    }

    async makeRequest(method, endpoint, data = {}) {
        /**
         * Make a request to the Grafana API
         */
        const url = `${this.baseUrl}${endpoint}`;
        try {
            const response = await this.client.request({
                method,
                url,
                data
            });
            return response.data;
        } catch (error) {
            console.error(`Request failed: ${error}`);
            throw error;
        }
    }

    async createDashboard(title, panels = []) {
        /**
         * Create a new dashboard with specified title and panels
         */
        const dashboard = {
            dashboard: {
                id: null,
                uid: 'custom_uid_test',
                title: title,
                tags: [],
                timezone: 'browser',
                schemaVersion: 36,
                version: 0,
                panels: panels,
                editable: true,
                time: {
                    from: 'now-6h',
                    to: 'now'
                },
                refresh: '5s'
            },
            message: `Dashboard created at ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
            overwrite: true
        };

        return this.makeRequest('POST', '/api/dashboards/db', dashboard);
    }

    async getDashboardByUID(uid) {
        /**
         * Get dashboard by UID
         */
        return this.makeRequest('GET', `/api/dashboards/uid/${uid}`);
    }
    
    async createSampleDashboard() {
        /**
         * Create a sample dashboard with some example panels
         */
        const panels = [
          {
          }
        ];

        return this.createDashboard('New Dashboard', panels);
    }
}

function displayDashboardInfo(dashboardData) {
    /**
     * Display dashboard information in a formatted way
     */
    console.log('\n=== Dashboard Information ===');
    console.log(`Title: ${dashboardData.dashboard.title}`);
    console.log(`UID: ${dashboardData.dashboard.uid}`);
    console.log(`URL: ${dashboardData.meta.url}`);
    console.log('\nPanels:');
    dashboardData.dashboard.panels.forEach(panel => {
        console.log(`- ${panel.title} (Type: ${panel.type}, ID: ${panel.id})`);
    });
    console.log('\nAccess Information:');
    console.log(`Version: ${dashboardData.dashboard.version}`);
    console.log(`Last Updated: ${dashboardData.meta.updated}`);
    console.log('========================\n');
}

// Example usage
(async () => {
    try {
        
        const WORKSPACE = process.env.GRAFANA_WORKSPACE || 'jrcrmtctl-graph-ekdgh0f5emfdc0bz.tyo.grafana.azure.com';
        const API_KEY = process.env.GRAFANA_API_KEY || 'glsa_gqFfSmkT7hqUm5coHS7dehuyPTzDRiKR_fdc7aa19';

        const grafana = new AzureGrafanaAPIClient(WORKSPACE, API_KEY);

        console.log('Creating sample dashboard...');
        const result = await grafana.createSampleDashboard();

        const dashboardUid = result.uid;

        console.log('Fetching dashboard details...');
        const dashboard = await grafana.getDashboardByUID(dashboardUid);

        displayDashboardInfo(dashboard);

        console.log(`Dashboard URL: ${dashboard.meta.url}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
})();
