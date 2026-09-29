#ifndef CUSTOM_HASH_TABLE_HPP
#define CUSTOM_HASH_TABLE_HPP

#include "TransactionRecord.hpp"

struct HashNode {
    TransactionRecord record;
    HashNode* next;
};

class CustomHashTable {
public:
    CustomHashTable(int bucketCount = 256);
    ~CustomHashTable();

    CustomHashTable(const CustomHashTable&) = delete;
    CustomHashTable& operator=(const CustomHashTable&) = delete;

    void insert(const TransactionRecord& rec);
    HashNode* find(const char* id) const;
    bool findAndRemove(const char* id, double amount, TransactionRecord& out);
    bool removeById(const char* id, TransactionRecord& out);
    int getSize() const;
    int getCapacity() const;
    void drainRemaining(TransactionRecord* out, int maxOut, int& written);
    void clear();

private:
    HashNode** buckets;
    int capacity;
    int size;

    unsigned hashKey(const char* id) const;
    void freeChains();
};

#endif
