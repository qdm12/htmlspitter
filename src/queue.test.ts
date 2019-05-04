import { Queue } from "./queue";

describe("constructor", () => {
    it("creates a queue of length 10", () => {
        const q = new Queue(10);
        expect(q.ids.length).toBe(0);
        expect(q.maxSize).toBe(10);
    });
    it("creates a queue of unlimited length", () => {
        const q = new Queue(-1);
        expect(q.ids.length).toBe(0);
        expect(q.maxSize).toBe(-1);
    });
});

describe("getNextID", () => {
    it("gets first ID", () => {
        const q = new Queue(10);
        const id = q.getNextID();
        expect(id).toBe(0);
    });
    it("gets first and second ID", () => {
        const q = new Queue(10);
        const id1 = q.getNextID();
        q.push();
        const id2 = q.getNextID();
        expect(id1).toBe(0);
        expect(id2).toBe(1);
    });
    it("gets ID 1 in the middle", () => {
        const q = new Queue(10);
        q.push();
        q.push();
        q.push();
        q.shift();
        q.shift();
        q.push();
        const id = q.getNextID();
        expect(id).toBe(1);
    });
});

describe("push", () => {
    it("once", () => {
        const q = new Queue(10);
        q.push();
        expect(q.ids.length).toBe(1);
    });
    it("multiple times", () => {
        const q = new Queue(10);
        q.push();
        q.push();
        expect(q.ids.length).toBe(2);
    });
    it("too many times", () => {
        const q = new Queue(2);
        q.push();
        q.push();
        const f = () => q.push();
        expect(f).toThrowError("queue reached its maximum size")
        expect(q.ids.length).toBe(2);
    });
});

describe("shift", () => {
    it("once for queue of size 2", () => {
        const q = new Queue(10);
        q.push();
        q.push();
        q.shift();
        expect(q.ids.length).toBe(1);
    });
    it("all in queue", () => {
        const q = new Queue(10);
        q.push();
        q.push();
        q.shift();
        q.shift();
        expect(q.ids.length).toBe(0);
    });
    it("too many times", () => {
        const q = new Queue(10);
        q.push();
        q.shift();
        const f = () => q.shift();
        expect(f).toThrowError("cannot shift because queue is empty")
        expect(q.ids.length).toBe(0);
    });
});