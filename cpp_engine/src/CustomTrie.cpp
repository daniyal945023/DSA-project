#include "CustomTrie.hpp"
#include "TransactionRecord.hpp"

CustomTrie::CustomTrie() {
    root = createNode();
}

CustomTrie::~CustomTrie() {
    destroyNode(root);
    root = nullptr;
}

TrieNode* CustomTrie::createNode() {
    TrieNode* node = new TrieNode();
    node->isEnd = false;
    node->word[0] = '\0';
    for (int i = 0; i < 128; ++i) {
        node->children[i] = nullptr;
    }
    return node;
}

void CustomTrie::destroyNode(TrieNode* node) {
    if (!node) {
        return;
    }
    for (int i = 0; i < 128; ++i) {
        destroyNode(node->children[i]);
    }
    delete node;
}

unsigned char CustomTrie::safeIndex(char c) {
    unsigned char uc = static_cast<unsigned char>(c);
    if (uc > 127) {
        return 63;
    }
    return uc;
}

void CustomTrie::insert(const char* word) {
    if (!word || !root) {
        return;
    }
    TrieNode* cur = root;
    for (int i = 0; word[i] != '\0'; ++i) {
        unsigned char idx = safeIndex(word[i]);
        if (!cur->children[idx]) {
            cur->children[idx] = createNode();
        }
        cur = cur->children[idx];
    }
    cur->isEnd = true;
    copyCStr(cur->word, word, 128);
}

bool CustomTrie::searchExact(const char* word) const {
    if (!word || !root) {
        return false;
    }
    TrieNode* cur = root;
    for (int i = 0; word[i] != '\0'; ++i) {
        unsigned char idx = safeIndex(word[i]);
        if (!cur->children[idx]) {
            return false;
        }
        cur = cur->children[idx];
    }
    return cur->isEnd;
}

void CustomTrie::collect(TrieNode* node, char results[][128], int maxResults, int& count) const {
    if (!node || count >= maxResults) {
        return;
    }
    if (node->isEnd) {
        copyCStr(results[count], node->word, 128);
        ++count;
    }
    for (int i = 0; i < 128 && count < maxResults; ++i) {
        if (node->children[i]) {
            collect(node->children[i], results, maxResults, count);
        }
    }
}

int CustomTrie::searchPrefix(const char* prefix, char results[][128], int maxResults) const {
    int count = 0;
    if (!prefix || !root || maxResults <= 0) {
        return 0;
    }
    TrieNode* cur = root;
    for (int i = 0; prefix[i] != '\0'; ++i) {
        unsigned char idx = safeIndex(prefix[i]);
        if (!cur->children[idx]) {
            return 0;
        }
        cur = cur->children[idx];
    }
    collect(cur, results, maxResults, count);
    return count;
}

void CustomTrie::clear() {
    destroyNode(root);
    root = createNode();
}
