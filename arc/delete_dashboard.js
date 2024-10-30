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

    async getDashboardByUID(uid) {
        /**
         * Get dashboard by UID
         */
        return this.makeRequest('GET', `/api/dashboards/uid/${uid}`);
    }

    async deleteDashboard(uid) {
        /**
         * Delete dashboard by UID
         */
        return this.makeRequest('DELETE', `/api/dashboards/uid/${uid}`);
    }
    
}

// Example usage
(async () => {
    try {
        const WORKSPACE = process.env.GRAFANA_WORKSPACE || 'jrcrmtctl-graph-ekdgh0f5emfdc0bz.tyo.grafana.azure.com';
        const API_KEY = process.env.GRAFANA_API_KEY || 'glsa_gqFfSmkT7hqUm5coHS7dehuyPTzDRiKR_fdc7aa19';

        const grafana = new AzureGrafanaAPIClient(WORKSPACE, API_KEY);


        // Delete the created dashboard by UID
        // Pass your UID below
        const dashboardUid = 'custom_uid_test';
        const dashboard = await grafana.getDashboardByUID(dashboardUid);
        console.log(`Get Dashboard Details-->: ${dashboard.dashboard.id}`);
        const deleteResult = await grafana.deleteDashboard(dashboard.dashboard.uid);

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
})();
