export class Queue {
    ids: number[];
    idsInQueue: Set<number>;
    maxSize: number;
    constructor(maxSize: number) { // -1 for unlimited queue
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
        return id;
    }
    getNextID() {
        for (let nextID = 0; nextID < this.idsInQueue.size; nextID++) {
            if (!this.idsInQueue.has(nextID)) {
                this.idsInQueue.add(nextID);
                return nextID;
            }
        }
        // Need to create a new index
        const nextID = this.idsInQueue.size
        this.idsInQueue.add(nextID);
        return nextID;
    }
    shift() {
        const idRemoved = this.ids.shift();
        if (idRemoved === undefined) {
            throw Error("cannot shift because queue is empty");
        }
        this.idsInQueue.delete(idRemoved);
    }
    isFirst(id: number) {
        return id === this.ids[0];
    }
}