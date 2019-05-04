export class Queue {
    ids: number[];
    maxSize: number;
    constructor(maxSize: number) { // -1 for unlimited queue
        this.maxSize = maxSize;
        this.ids = [];
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
    getNextID() { // use a set for higher performance
        let nextID = -1;
        let found = false;
        while (!found) {
            nextID++;
            found = this.ids.indexOf(nextID) === -1;
        }
        return nextID;
    }
    shift() {
        const idRemoved = this.ids.shift();
        if (idRemoved === undefined) {
            throw Error("cannot shift because queue is empty");
        }
    }
    isFirst(id: number) {
        return id === this.ids[0];
    }
}