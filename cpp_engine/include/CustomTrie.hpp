#ifndef CUSTOM_TRIE_HPP
#define CUSTOM_TRIE_HPP

struct TrieNode {
    TrieNode* children[128];
    bool isEnd;
    char word[128];
};

class CustomTrie {
public:
    CustomTrie();
    ~CustomTrie();

    CustomTrie(const CustomTrie&) = delete;
    CustomTrie& operator=(const CustomTrie&) = delete;

    void insert(const char* word);
    bool searchExact(const char* word) const;
    int searchPrefix(const char* prefix, char results[][128], int maxResults) const;
    void clear();

private:
    TrieNode* root;

    TrieNode* createNode();
    void destroyNode(TrieNode* node);
    void collect(TrieNode* node, char results[][128], int maxResults, int& count) const;
    static unsigned char safeIndex(char c);
};

#endif
