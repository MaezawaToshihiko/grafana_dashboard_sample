<template>
    <div class="table-container">
        <table>
            <tr>
                <td class="fixed-width">

                </td>
                <td>
                    <button @click="toggleMode">
                        {{ useTimeRangeMode ? 'Real-time' : 'Time Range' }}
                    </button>
                </td>
            </tr>
            <tr class="fixed-height">
                <td>
                    <div v-if="useTimeRangeMode">
                        <input type="datetime-local" v-model="datetime_from" />
                        <input type="datetime-local" v-model="datetime_to" />
                    </div>
                    <!-- Duration from current time dropdown selector -->
                    <div v-else>
                        <select v-model="duration">
                            <option value="now-5m">Last 5 minutes</option>
                            <option value="now-15m">Last 15 minutes</option>
                            <option value="now-30m">Last 30 minutes</option>
                            <option value="now-1h">Last 1 hour</option>
                            <option value="now-3h">Last 3 hours</option>
                        </select>
                        <select v-model="refresh">
                            <option value="auto">Auto</option>
                            <option value="5s">5s</option>
                            <option value="10s">10s</option>
                            <option value="30s">30s</option>
                            <option value="1m">1m</option>
                        </select>
                    </div>
                </td>
                <td>
                    <button class="submit-button" @click="handleSubmit">Submit</button>
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    name: 'TimeSelector',
    data() {
        return {
            useTimeRangeMode: true,
            datetimeFrom: '',
            datetimeTo: '',
            duration: 'now-5m',
            refresh: 'auto'
        }
    },
    methods: {
        toggleMode() {
            this.useTimeRangeMode = !this.useTimeRangeMode;
        },

        handleSubmit() {
            const dashboard_id = '3dfc3e57b69d';
            const dashboard_name = 'testdashboard-20241025-214236';
            const baseUrl = `https://jrcrmtctl-graph-ekdgh0f5emfdc0bz.tyo.grafana.azure.com/d-solo/${dashboard_id}/${dashboard_name}?orgId=1`;
            const viewPanel = '&panelId=2';

            let url;
            let timeRangeParam;

            if (this.useTimeRangeMode) {
                const fromTimestamp = this.convertDateTimeToTimestamp(this.datetime_from);
                const toTimestamp = this.convertDateTimeToTimestamp(this.datetime_to);
                timeRangeParam = `&from=${fromTimestamp}&to=${toTimestamp}`;
                url = `${baseUrl}${timeRangeParam}${viewPanel}`;
                console.log(url);
            } else {
                const interval = `&refresh=${this.refresh}`;
                timeRangeParam = `&from=${this.duration}&to=now`;
                url = `${baseUrl}${timeRangeParam}${viewPanel}${interval}`;
            }

            // console.log(url);
            window.open(url, '_blank');
        },
        convertDateTimeToTimestamp(dateTimeString) {
            return new Date(dateTimeString).getTime();
        }
    }
}

</script>

<style>
.table-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
}

table {
    border-collapse: collapse;
    margin-bottom: 10px;
}

.fixed-height {
    height: 50px;
}

.fixed-width {
    width: 200px;
}

.fixed-width input,
.fixed-width select {
    width: 100%;
    box-sizing: border-box;
    text-align: left;
}

.submit-button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.submit-button:hover {
    background-color: #0056b3;
}
</style>