#ifndef CUSTOM_DOUBLY_LINKED_LIST_HPP
#define CUSTOM_DOUBLY_LINKED_LIST_HPP

#include "TransactionRecord.hpp"

struct DLLNode {
    TransactionRecord data;
    DLLNode* prev;
    DLLNode* next;
};

class CustomDoublyLinkedList {
public:
    CustomDoublyLinkedList();
    ~CustomDoublyLinkedList();

    CustomDoublyLinkedList(const CustomDoublyLinkedList&) = delete;
    CustomDoublyLinkedList& operator=(const CustomDoublyLinkedList&) = delete;

    void pushBack(const TransactionRecord& rec);
    void pushFront(const TransactionRecord& rec);
    int getSize() const;
    DLLNode* getHead() const;
    DLLNode* getTail() const;
    void snapshot(TransactionRecord* out, int maxOut, int& written) const;
    void clear();

private:
    DLLNode* head;
    DLLNode* tail;
    int size;
};

#endif
