#include "CustomHashTable.hpp"

CustomHashTable::CustomHashTable(int bucketCount) {
    capacity = bucketCount > 0 ? bucketCount : 256;
    size = 0;
    buckets = new HashNode*[capacity];
    for (int i = 0; i < capacity; ++i) {
        buckets[i] = nullptr;
    }
}

CustomHashTable::~CustomHashTable() {
    freeChains();
    delete[] buckets;
    buckets = nullptr;
}

unsigned CustomHashTable::hashKey(const char* id) const {
    unsigned long h = 5381;
    if (!id) {
        return 0;
    }
    for (int i = 0; id[i] != '\0'; ++i) {
        h = ((h << 5) + h) + static_cast<unsigned char>(id[i]);
    }
    return static_cast<unsigned>(h % static_cast<unsigned long>(capacity));
}

void CustomHashTable::insert(const TransactionRecord& rec) {
    unsigned idx = hashKey(rec.id);
    HashNode* node = new HashNode();
    copyTransaction(node->record, rec);
    node->next = buckets[idx];
    buckets[idx] = node;
    ++size;
}

HashNode* CustomHashTable::find(const char* id) const {
    unsigned idx = hashKey(id);
    HashNode* cur = buckets[idx];
    while (cur) {
        if (cStrEquals(cur->record.id, id)) {
            return cur;
        }
        cur = cur->next;
    }
    return nullptr;
}

bool CustomHashTable::findAndRemove(const char* id, double amount, TransactionRecord& out) {
    unsigned idx = hashKey(id);
    HashNode* cur = buckets[idx];
    HashNode* prev = nullptr;
    while (cur) {
        if (cStrEquals(cur->record.id, id) && amountsEqual(cur->record.amount, amount)) {
            copyTransaction(out, cur->record);
            if (prev) {
                prev->next = cur->next;
            } else {
                buckets[idx] = cur->next;
            }
            delete cur;
            --size;
            return true;
        }
        prev = cur;
        cur = cur->next;
    }
    return false;
}

bool CustomHashTable::removeById(const char* id, TransactionRecord& out) {
    unsigned idx = hashKey(id);
    HashNode* cur = buckets[idx];
    HashNode* prev = nullptr;
    while (cur) {
        if (cStrEquals(cur->record.id, id)) {
            copyTransaction(out, cur->record);
            if (prev) {
                prev->next = cur->next;
            } else {
                buckets[idx] = cur->next;
            }
            delete cur;
            --size;
            return true;
        }
        prev = cur;
        cur = cur->next;
    }
    return false;
}

int CustomHashTable::getSize() const {
    return size;
}

int CustomHashTable::getCapacity() const {
    return capacity;
}

void CustomHashTable::drainRemaining(TransactionRecord* out, int maxOut, int& written) {
    written = 0;
    if (!out || maxOut <= 0) {
        return;
    }
    for (int i = 0; i < capacity && written < maxOut; ++i) {
        HashNode* cur = buckets[i];
        while (cur && written < maxOut) {
            copyTransaction(out[written], cur->record);
            ++written;
            cur = cur->next;
        }
    }
}

void CustomHashTable::clear() {
    freeChains();
    for (int i = 0; i < capacity; ++i) {
        buckets[i] = nullptr;
    }
    size = 0;
}

void CustomHashTable::freeChains() {
    if (!buckets) {
        return;
    }
    for (int i = 0; i < capacity; ++i) {
        HashNode* cur = buckets[i];
        while (cur) {
            HashNode* nxt = cur->next;
            delete cur;
            cur = nxt;
        }
        buckets[i] = nullptr;
    }
    size = 0;
}
