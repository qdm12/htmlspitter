export class Queue {
    ids:number[];
    idsInQueue:Set<number>;
    maxSize:number;
    constructor(maxSize:number) {
        this.maxSize = maxSize;
        this.ids = [];
        this.idsInQueue = new Set();
    }
    // Adds an element to the back of the queue
    push() {
        if (this.ids.length === this.maxSize) {
            throw Error("queue reached its maximum size")
        }
        const id = this.getNextID();
        this.ids.push(id);
        this.idsInQueue.add(id);
        return id;
    }
    getNextID() {
        for(let nextID = 0; nextID < this.idsInQueue.size; nextID++) {
            if (!this.idsInQueue.has(nextID)) {
                return nextID;
            }
        }
        // Need to create a new index
        return this.idsInQueue.size;
    }
    shift() {
        const idRemoved = this.ids.shift();
        if (idRemoved === undefined) {
            throw Error("ID shifted out from queue is undefined");
        }
        this.idsInQueue.delete(idRemoved);
    }
    isFirst(id:number) {
        return id === this.ids[0];
    }
    // adds to queue and waits for first turn asynchronously
    async wait(isReady:()=>boolean, periodms:number) {
        const id = this.push();
        while (!(isReady() && this.isFirst(id))) {
            await this.sleep(periodms);
        }
        this.shift();
    }
    sleep(ms:number) {
        return new Promise(resolve=>{
            setTimeout(resolve,ms)
        });
    }
}