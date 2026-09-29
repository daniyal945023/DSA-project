#include "CustomDoublyLinkedList.hpp"

CustomDoublyLinkedList::CustomDoublyLinkedList() {
    head = nullptr;
    tail = nullptr;
    size = 0;
}

CustomDoublyLinkedList::~CustomDoublyLinkedList() {
    clear();
}

void CustomDoublyLinkedList::pushBack(const TransactionRecord& rec) {
    DLLNode* node = new DLLNode();
    copyTransaction(node->data, rec);
    node->prev = tail;
    node->next = nullptr;
    if (!head) {
        head = node;
        tail = node;
    } else {
        tail->next = node;
        tail = node;
    }
    ++size;
}

void CustomDoublyLinkedList::pushFront(const TransactionRecord& rec) {
    DLLNode* node = new DLLNode();
    copyTransaction(node->data, rec);
    node->next = head;
    node->prev = nullptr;
    if (!head) {
        head = node;
        tail = node;
    } else {
        head->prev = node;
        head = node;
    }
    ++size;
}

int CustomDoublyLinkedList::getSize() const {
    return size;
}

DLLNode* CustomDoublyLinkedList::getHead() const {
    return head;
}

DLLNode* CustomDoublyLinkedList::getTail() const {
    return tail;
}

void CustomDoublyLinkedList::snapshot(TransactionRecord* out, int maxOut, int& written) const {
    written = 0;
    DLLNode* cur = head;
    while (cur && written < maxOut) {
        copyTransaction(out[written], cur->data);
        ++written;
        cur = cur->next;
    }
}

void CustomDoublyLinkedList::clear() {
    DLLNode* cur = head;
    while (cur) {
        DLLNode* nxt = cur->next;
        delete cur;
        cur = nxt;
    }
    head = nullptr;
    tail = nullptr;
    size = 0;
}
