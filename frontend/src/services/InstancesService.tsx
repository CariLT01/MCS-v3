import { ENDPOINT } from "../Config";
import { useInstancesStore } from "../stores/InstancesStore";

type InstanceGetResponse = {name: string, id: number}[];

class InstancesServiceClass {
    constructor() {

    }

    async load() {
        const response = await fetch(`${ENDPOINT}/api/v1/instance/get`);

        if (!response.ok) {
            throw new Error("Response did not succeed");
        }

        const data: InstanceGetResponse = await response.json();

        useInstancesStore.setState({instances: data});

    }

    async getInstanceName(id: number) {
        const response = await fetch(`${ENDPOINT}/api/v1/instance/get`);

        if (!response.ok) {
            throw new Error("Response did not succeed");
        }

        const data: InstanceGetResponse = await response.json();

        for (const inst of data) {
            if (inst.id == id) {
                console.log("compare: ", inst.id, id);
                return inst.name;
            }
        }
        return null;
    }
}

export const InstancesService = new InstancesServiceClass();