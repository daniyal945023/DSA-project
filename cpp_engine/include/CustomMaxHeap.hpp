#ifndef CUSTOM_MAX_HEAP_HPP
#define CUSTOM_MAX_HEAP_HPP

#include "TransactionRecord.hpp"

class CustomMaxHeap {
public:
    CustomMaxHeap(int initialCapacity = 16);
    ~CustomMaxHeap();

    CustomMaxHeap(const CustomMaxHeap&) = delete;
    CustomMaxHeap& operator=(const CustomMaxHeap&) = delete;

    void push(const TransactionRecord& rec);
    bool peek(TransactionRecord& out) const;
    bool pop(TransactionRecord& out);
    int getSize() const;
    bool isEmpty() const;
    void snapshotTop(TransactionRecord* out, int maxOut, int& written) const;
    void clear();

private:
    TransactionRecord* data;
    int size;
    int capacity;

    void grow();
    void heapifyUp(int index);
    void heapifyDown(int index);
    static int parent(int i);
    static int leftChild(int i);
    static int rightChild(int i);
    static double rank(const TransactionRecord& rec);
};

#endif
