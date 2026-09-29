#include "CustomMaxHeap.hpp"

CustomMaxHeap::CustomMaxHeap(int initialCapacity) {
    capacity = initialCapacity > 0 ? initialCapacity : 16;
    size = 0;
    data = new TransactionRecord[capacity];
}

CustomMaxHeap::~CustomMaxHeap() {
    delete[] data;
    data = nullptr;
}

void CustomMaxHeap::grow() {
    int newCap = capacity * 2;
    TransactionRecord* grown = new TransactionRecord[newCap];
    for (int i = 0; i < size; ++i) {
        copyTransaction(grown[i], data[i]);
    }
    delete[] data;
    data = grown;
    capacity = newCap;
}

int CustomMaxHeap::parent(int i) {
    return (i - 1) / 2;
}

int CustomMaxHeap::leftChild(int i) {
    return 2 * i + 1;
}

int CustomMaxHeap::rightChild(int i) {
    return 2 * i + 2;
}

double CustomMaxHeap::rank(const TransactionRecord& rec) {
    return rec.amount < 0.0 ? -rec.amount : rec.amount;
}

void CustomMaxHeap::heapifyUp(int index) {
    while (index > 0) {
        int p = parent(index);
        if (rank(data[index]) <= rank(data[p])) {
            break;
        }
        TransactionRecord tmp;
        copyTransaction(tmp, data[index]);
        copyTransaction(data[index], data[p]);
        copyTransaction(data[p], tmp);
        index = p;
    }
}

void CustomMaxHeap::heapifyDown(int index) {
    while (true) {
        int l = leftChild(index);
        int r = rightChild(index);
        int largest = index;
        if (l < size && rank(data[l]) > rank(data[largest])) {
            largest = l;
        }
        if (r < size && rank(data[r]) > rank(data[largest])) {
            largest = r;
        }
        if (largest == index) {
            break;
        }
        TransactionRecord tmp;
        copyTransaction(tmp, data[index]);
        copyTransaction(data[index], data[largest]);
        copyTransaction(data[largest], tmp);
        index = largest;
    }
}

void CustomMaxHeap::push(const TransactionRecord& rec) {
    if (size >= capacity) {
        grow();
    }
    copyTransaction(data[size], rec);
    heapifyUp(size);
    ++size;
}

bool CustomMaxHeap::peek(TransactionRecord& out) const {
    if (size <= 0) {
        return false;
    }
    copyTransaction(out, data[0]);
    return true;
}

bool CustomMaxHeap::pop(TransactionRecord& out) {
    if (size <= 0) {
        return false;
    }
    copyTransaction(out, data[0]);
    --size;
    if (size > 0) {
        copyTransaction(data[0], data[size]);
        heapifyDown(0);
    }
    return true;
}

int CustomMaxHeap::getSize() const {
    return size;
}

bool CustomMaxHeap::isEmpty() const {
    return size == 0;
}

void CustomMaxHeap::snapshotTop(TransactionRecord* out, int maxOut, int& written) const {
    written = 0;
    if (!out || maxOut <= 0 || size <= 0) {
        return;
    }
    CustomMaxHeap clone(size > 0 ? size : 1);
    for (int i = 0; i < size; ++i) {
        clone.push(data[i]);
    }
    TransactionRecord tmp;
    while (written < maxOut && clone.pop(tmp)) {
        copyTransaction(out[written], tmp);
        ++written;
    }
}

void CustomMaxHeap::clear() {
    size = 0;
}
