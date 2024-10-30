<template>
    <form @submit.prevent="handleSubmit">
        <div>
            <label>Graph 1: </label>
            <select v-model="selectedOption1">
                <option v-for="option in options" :key="option.value">{{ option.text }}</option>
            </select>

        </div>
        <div>
            <label>Graph 2: </label>
            <select v-model="selectedOption2">
                <option v-for="option in options" :key="option.value">{{ option.text }}</option>
            </select>
        </div>

        <p v-if="showWarning" :style="{ color: 'red' }">{{ warningMessage }}</p>
        <p>
        <div>
            <label>Date from: </label>
            <input type="date" v-model="date_from" />
            <input type="time" step="1" v-model="time_from" />
        </div>
        <div>
            <label>Date to: </label>
            <input type="date" v-model="date_to" />
            <input type="time" step="1" v-model="time_to" />
        </div>

        </p>
        <p>

        <div class="">
            <p>
                <button type="submit">Show graph</button>
            </p>
        </div>

        </p>

    </form>

</template>

<script>
export default {

    data() {
        return {
            options: [
                { value: 1, text: 'CA_001' },
                { value: 2, text: 'CA_002' },
                { value: 3, text: 'CA_003' },
                { value: 4, text: 'CA_004' },
                { value: 5, text: 'CA_005' },
                { value: 6, text: 'CA_006' },
                { value: 7, text: 'CA_007' },
                { value: 8, text: 'CA_008' },
                { value: 9, text: 'CA_009' }
            ],
            selectedOption1: null,
            selectedOption2: null,
            showWarning: false,
            warningMessage: 'Please select different options.',
            date_from: null,
            date_to: null,
            browserWindow: null,
            apiKey: 'sa-1-test-dee8c410-6ad7-4523-a7b8-b59519f30b61' // Add your API key here
        };
    },
    watch: {
        selectedOption1(newValue, oldValue) {
            if (newValue === this.selectedOption2) {
                this.showWarning = true;
            } else {
                this.showWarning = false;
            }
        },
        selectedOption2(newValue, oldValue) {
            if (newValue === this.selectedOption1) {
                this.showWarning = true;
            } else {
                this.showWarning = false;
            }
        }
    },
    methods: {
        handleSubmit() {
            console.log("form submitted");
            const base_url = 'https://jrcrmtctl-graph-ekdgh0f5emfdc0bz.tyo.grafana.azure.com/d-solo/fdzqr0kjtjm68e/grafana-initial-test?orgId=1'
            const q1 ='&var-Analogitem_id1=' + this.selectedOption1
            const q2 = '&var-Analogitem_id2=' + this.selectedOption2  

            const fromTimestamp = this.convertDateTimeToTimestamp(this.date_from, this.time_from);
            const toTimestamp = this.convertDateTimeToTimestamp(this.date_to, this.time_to);
            const time_range = '&from=' + fromTimestamp + '&to=' + toTimestamp + '&panelId=1';
            console.log(`From: ${fromTimestamp}, To: ${toTimestamp}`);

            // URL you want to open 
            var url = base_url + q1 + q2 + time_range

            // Target window name
            const target = 'grafana_window';
            // Open the URL in the specified window
            window.open(url, target);
        },
        convertDateTimeToTimestamp(date, time) {
            const dateTimeString = `${date}T${time}`;
            return new Date(dateTimeString).getTime();
        },
    }
}
    

</script>