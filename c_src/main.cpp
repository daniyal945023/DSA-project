#include <iostream>
#include <fstream>
#include <cstring>
#include <cstdlib>
#include <emscripten.h>

// ==========================================
// 1. Transaction Record Struct
// ==========================================
struct TransactionRecord {
    char id[64];
    char date[32];
    double amount;
    char memo[256];
    char status[32];
};

// ==========================================
// 2. Custom Doubly Linked List (Audit Trail)
// ==========================================
struct ListNode {
    TransactionRecord record;
    ListNode* prev;
    ListNode* next;
    ListNode(const TransactionRecord& rec) : record(rec), prev(nullptr), next(nullptr) {}
};

class CustomDoublyLinkedList {
private:
    ListNode* head;
    ListNode* tail;
    int count;

public:
    CustomDoublyLinkedList() : head(nullptr), tail(nullptr), count(0) {}

    ~CustomDoublyLinkedList() {
        ListNode* curr = head;
        while (curr) {
            ListNode* temp = curr;
            curr = curr->next;
            delete temp;
        }
    }

    void append(const TransactionRecord& rec) {
        ListNode* newNode = new ListNode(rec);
        if (!head) {
            head = tail = newNode;
        } else {
            tail->next = newNode;
            newNode->prev = tail;
            tail = newNode;
        }
        count++;
    }

    int size() const { return count; }
};

// ==========================================
// 3. Custom HashTable (O(1) Exact Matching)
// ==========================================
struct HashNode {
    TransactionRecord record;
    HashNode* next;
    HashNode(const TransactionRecord& rec) : record(rec), next(nullptr) {}
};

class CustomHashTable {
private:
    static const int BUCKET_COUNT = 101;
    HashNode* buckets[BUCKET_COUNT];

    unsigned int hashFunction(const char* str) {
        unsigned int hash = 5381;
        int c;
        while ((c = *str++)) {
            hash = ((hash << 5) + hash) + c;
        }
        return hash % BUCKET_COUNT;
    }

public:
    CustomHashTable() {
        for (int i = 0; i < BUCKET_COUNT; i++) buckets[i] = nullptr;
    }

    ~CustomHashTable() {
        for (int i = 0; i < BUCKET_COUNT; i++) {
            HashNode* curr = buckets[i];
            while (curr) {
                HashNode* temp = curr;
                curr = curr->next;
                delete temp;
            }
        }
    }

    void insert(const TransactionRecord& rec) {
        unsigned int idx = hashFunction(rec.id);
        HashNode* newNode = new HashNode(rec);
        newNode->next = buckets[idx];
        buckets[idx] = newNode;
    }

    bool findAndMarkMatched(const char* id, double amount) {
        unsigned int idx = hashFunction(id);
        HashNode* curr = buckets[idx];
        while (curr) {
            if (strcmp(curr->record.id, id) == 0 && curr->record.amount == amount) {
                strcpy(curr->record.status, "MATCHED");
                return true;
            }
            curr = curr->next;
        }
        return false;
    }
};

// ==========================================
// 4. Custom MaxHeap (Priority Discrepancy Queue)
// ==========================================
class CustomMaxHeap {
private:
    TransactionRecord* array;
    int capacity;
    int heapSize;

    void resize() {
        capacity *= 2;
        TransactionRecord* newArr = new TransactionRecord[capacity];
        for (int i = 0; i < heapSize; i++) {
            newArr[i] = array[i];
        }
        delete[] array;
        array = newArr;
    }

    void heapifyUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (array[index].amount > array[parent].amount) {
                TransactionRecord temp = array[index];
                array[index] = array[parent];
                array[parent] = temp;
                index = parent;
            } else {
                break;
            }
        }
    }

public:
    CustomMaxHeap() : capacity(16), heapSize(0) {
        array = new TransactionRecord[capacity];
    }

    ~CustomMaxHeap() {
        delete[] array;
    }

    void insert(const TransactionRecord& rec) {
        if (heapSize >= capacity) resize();
        array[heapSize] = rec;
        heapifyUp(heapSize);
        heapSize++;
    }

    int size() const { return heapSize; }

    bool getMax(TransactionRecord& outRec) {
        if (heapSize == 0) return false;
        outRec = array[0];
        return true;
    }
};

// ==========================================
// 5. Custom Trie (Vendor Prefix Search)
// ==========================================
struct TrieNode {
    TrieNode* children[128];
    bool isEndOfWord;
    TrieNode() : isEndOfWord(false) {
        for (int i = 0; i < 128; i++) children[i] = nullptr;
    }
};

class CustomTrie {
private:
    TrieNode* root;

    void destroyRecursive(TrieNode* node) {
        if (!node) return;
        for (int i = 0; i < 128; i++) {
            if (node->children[i]) destroyRecursive(node->children[i]);
        }
        delete node;
    }

public:
    CustomTrie() { root = new TrieNode(); }
    ~CustomTrie() { destroyRecursive(root); }

    void insert(const char* str) {
        TrieNode* curr = root;
        for (int i = 0; str[i] != '\0'; i++) {
            unsigned char idx = (unsigned char)str[i];
            if (idx >= 128) continue;
            if (!curr->children[idx]) {
                curr->children[idx] = new TrieNode();
            }
            curr = curr->children[idx];
        }
        curr->isEndOfWord = true;
    }

    bool searchPrefix(const char* prefix) {
        TrieNode* curr = root;
        for (int i = 0; prefix[i] != '\0'; i++) {
            unsigned char idx = (unsigned char)prefix[i];
            if (idx >= 128 || !curr->children[idx]) return false;
            curr = curr->children[idx];
        }
        return true;
    }
};

// ==========================================
// 6. Custom AVL Tree (Dollar Range Queries)
// ==========================================
struct AVLNode {
    TransactionRecord record;
    AVLNode* left;
    AVLNode* right;
    int height;
    AVLNode(const TransactionRecord& rec) 
        : record(rec), left(nullptr), right(nullptr), height(1) {}
};

class CustomAVLTree {
private:
    AVLNode* root;

    int getHeight(AVLNode* n) { return n ? n->height : 0; }
    int getBalance(AVLNode* n) { return n ? getHeight(n->left) - getHeight(n->right) : 0; }
    int maxVal(int a, int b) { return (a > b) ? a : b; }

    AVLNode* rightRotate(AVLNode* y) {
        AVLNode* x = y->left;
        AVLNode* T2 = x->right;
        x->right = y;
        y->left = T2;
        y->height = maxVal(getHeight(y->left), getHeight(y->right)) + 1;
        x->height = maxVal(getHeight(x->left), getHeight(x->right)) + 1;
        return x;
    }

    AVLNode* leftRotate(AVLNode* x) {
        AVLNode* y = x->right;
        AVLNode* T2 = y->left;
        y->left = x;
        x->right = T2;
        x->height = maxVal(getHeight(x->left), getHeight(x->right)) + 1;
        y->height = maxVal(getHeight(y->left), getHeight(y->right)) + 1;
        return y;
    }

    AVLNode* insertRecursive(AVLNode* node, const TransactionRecord& rec) {
        if (!node) return new AVLNode(rec);

        if (rec.amount < node->record.amount)
            node->left = insertRecursive(node->left, rec);
        else
            node->right = insertRecursive(node->right, rec);

        node->height = 1 + maxVal(getHeight(node->left), getHeight(node->right));
        int balance = getBalance(node);

        if (balance > 1 && rec.amount < node->left->record.amount)
            return rightRotate(node);
        if (balance < -1 && rec.amount > node->right->record.amount)
            return leftRotate(node);
        if (balance > 1 && rec.amount > node->left->record.amount) {
            node->left = leftRotate(node->left);
            return rightRotate(node);
        }
        if (balance < -1 && rec.amount < node->right->record.amount) {
            node->right = rightRotate(node->right);
            return leftRotate(node);
        }
        return node;
    }

    void destroyRecursive(AVLNode* node) {
        if (!node) return;
        destroyRecursive(node->left);
        destroyRecursive(node->right);
        delete node;
    }

public:
    CustomAVLTree() : root(nullptr) {}
    ~CustomAVLTree() { destroyRecursive(root); }

    void insert(const TransactionRecord& rec) {
        root = insertRecursive(root, rec);
    }
};

// ==========================================
// 7. Global State & Engine Orchestration
// ==========================================
CustomHashTable glHashTable;
CustomDoublyLinkedList auditList;
CustomMaxHeap discrepancyQueue;
CustomTrie vendorTrie;
CustomAVLTree rangeTree;

int totalProcessed = 0;
int totalMatched = 0;
int totalUnmatched = 0;

extern "C" {

void parseCSVLine(const char* line, TransactionRecord& rec) {
    int col = 0, idx = 0;
    char temp[256] = {0};

    for (int i = 0; line[i] != '\0' && line[i] != '\r' && line[i] != '\n'; i++) {
        if (line[i] == ',') {
            temp[idx] = '\0';
            if (col == 0) strncpy(rec.id, temp, 63);
            else if (col == 1) strncpy(rec.date, temp, 31);
            else if (col == 2) rec.amount = atof(temp);
            col++;
            idx = 0;
            temp[0] = '\0';
        } else {
            if (idx < 255) temp[idx++] = line[i];
        }
    }
    temp[idx] = '\0';
    if (col == 3) strncpy(rec.memo, temp, 255);
    strcpy(rec.status, "UNMATCHED");
}

EMSCRIPTEN_KEEPALIVE
int processFilesFromMEMFS(const char* bankFilePath, const char* glFilePath) {
    totalProcessed = 0;
    totalMatched = 0;
    totalUnmatched = 0;

    // Ingest General Ledger via std::ifstream into HashTable
    std::ifstream glFile(glFilePath);
    if (!glFile.is_open()) return -1;

    char line[512];
    glFile.getline(line, 512); // Skip header

    while (glFile.getline(line, 512)) {
        if (strlen(line) < 5) continue;
        TransactionRecord rec;
        parseCSVLine(line, rec);
        glHashTable.insert(rec);
    }
    glFile.close();

    // Ingest Bank Feed via std::ifstream & Reconcile
    std::ifstream bankFile(bankFilePath);
    if (!bankFile.is_open()) return -2;

    bankFile.getline(line, 512); // Skip header

    std::ofstream reportFile("/reconciliation_report.csv");
    reportFile << "Transaction_ID,Date,Amount,Description,Status\n";

    while (bankFile.getline(line, 512)) {
        if (strlen(line) < 5) continue;
        TransactionRecord rec;
        parseCSVLine(line, rec);
        totalProcessed++;

        // Add memo to Trie
        vendorTrie.insert(rec.memo);

        // Add to AVL Tree by amount
        rangeTree.insert(rec);

        if (glHashTable.findAndMarkMatched(rec.id, rec.amount)) {
            strcpy(rec.status, "MATCHED");
            totalMatched++;
        } else {
            totalUnmatched++;
            // Push discrepancy into MaxHeap
            discrepancyQueue.insert(rec);
        }

        // Append to Doubly Linked List Audit Log
        auditList.append(rec);

        reportFile << rec.id << "," << rec.date << "," << rec.amount << "," 
                   << rec.memo << "," << rec.status << "\n";
    }

    bankFile.close();
    reportFile.close();
    return 0;
}

EMSCRIPTEN_KEEPALIVE
int getTotalProcessed() { return totalProcessed; }

EMSCRIPTEN_KEEPALIVE
int getTotalMatched() { return totalMatched; }

EMSCRIPTEN_KEEPALIVE
int getTotalUnmatched() { return totalUnmatched; }

EMSCRIPTEN_KEEPALIVE
int getDiscrepancyQueueSize() { return discrepancyQueue.size(); }

EMSCRIPTEN_KEEPALIVE
bool searchVendorPrefix(const char* prefix) {
    return vendorTrie.searchPrefix(prefix);
}

}