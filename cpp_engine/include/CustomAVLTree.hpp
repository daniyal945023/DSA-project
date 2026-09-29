#ifndef CUSTOM_AVL_TREE_HPP
#define CUSTOM_AVL_TREE_HPP

#include "TransactionRecord.hpp"

struct AVLNode {
    TransactionRecord record;
    AVLNode* left;
    AVLNode* right;
    int height;
};

class CustomAVLTree {
public:
    CustomAVLTree();
    ~CustomAVLTree();

    CustomAVLTree(const CustomAVLTree&) = delete;
    CustomAVLTree& operator=(const CustomAVLTree&) = delete;

    void insert(const TransactionRecord& rec);
    int rangeQuery(double minAmount, double maxAmount, TransactionRecord* out, int maxOut) const;
    int getSize() const;
    void clear();

private:
    AVLNode* root;
    int size;

    AVLNode* createNode(const TransactionRecord& rec);
    void destroyNode(AVLNode* node);
    int heightOf(AVLNode* node) const;
    int balanceFactor(AVLNode* node) const;
    void updateHeight(AVLNode* node);
    AVLNode* rotateRight(AVLNode* y);
    AVLNode* rotateLeft(AVLNode* x);
    AVLNode* insertNode(AVLNode* node, const TransactionRecord& rec);
    void rangeWalk(AVLNode* node, double minAmount, double maxAmount,
                   TransactionRecord* out, int maxOut, int& count) const;
};

#endif
