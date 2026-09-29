#include "CustomAVLTree.hpp"

CustomAVLTree::CustomAVLTree() {
    root = nullptr;
    size = 0;
}

CustomAVLTree::~CustomAVLTree() {
    destroyNode(root);
    root = nullptr;
}

AVLNode* CustomAVLTree::createNode(const TransactionRecord& rec) {
    AVLNode* node = new AVLNode();
    copyTransaction(node->record, rec);
    node->left = nullptr;
    node->right = nullptr;
    node->height = 1;
    return node;
}

void CustomAVLTree::destroyNode(AVLNode* node) {
    if (!node) {
        return;
    }
    destroyNode(node->left);
    destroyNode(node->right);
    delete node;
}

int CustomAVLTree::heightOf(AVLNode* node) const {
    return node ? node->height : 0;
}

int CustomAVLTree::balanceFactor(AVLNode* node) const {
    return node ? heightOf(node->left) - heightOf(node->right) : 0;
}

void CustomAVLTree::updateHeight(AVLNode* node) {
    if (!node) {
        return;
    }
    int hl = heightOf(node->left);
    int hr = heightOf(node->right);
    node->height = 1 + (hl > hr ? hl : hr);
}

AVLNode* CustomAVLTree::rotateRight(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* t2 = x->right;
    x->right = y;
    y->left = t2;
    updateHeight(y);
    updateHeight(x);
    return x;
}

AVLNode* CustomAVLTree::rotateLeft(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* t2 = y->left;
    y->left = x;
    x->right = t2;
    updateHeight(x);
    updateHeight(y);
    return y;
}

AVLNode* CustomAVLTree::insertNode(AVLNode* node, const TransactionRecord& rec) {
    if (!node) {
        ++size;
        return createNode(rec);
    }
    if (rec.amount < node->record.amount) {
        node->left = insertNode(node->left, rec);
    } else {
        node->right = insertNode(node->right, rec);
    }
    updateHeight(node);
    int bf = balanceFactor(node);
    if (bf > 1 && rec.amount < node->left->record.amount) {
        return rotateRight(node);
    }
    if (bf < -1 && rec.amount >= node->right->record.amount) {
        return rotateLeft(node);
    }
    if (bf > 1 && rec.amount >= node->left->record.amount) {
        node->left = rotateLeft(node->left);
        return rotateRight(node);
    }
    if (bf < -1 && rec.amount < node->right->record.amount) {
        node->right = rotateRight(node->right);
        return rotateLeft(node);
    }
    return node;
}

void CustomAVLTree::insert(const TransactionRecord& rec) {
    root = insertNode(root, rec);
}

void CustomAVLTree::rangeWalk(AVLNode* node, double minAmount, double maxAmount,
                              TransactionRecord* out, int maxOut, int& count) const {
    if (!node || count >= maxOut) {
        return;
    }
    if (node->record.amount > minAmount) {
        rangeWalk(node->left, minAmount, maxAmount, out, maxOut, count);
    }
    if (count < maxOut && node->record.amount >= minAmount && node->record.amount <= maxAmount) {
        copyTransaction(out[count], node->record);
        ++count;
    }
    if (node->record.amount < maxAmount) {
        rangeWalk(node->right, minAmount, maxAmount, out, maxOut, count);
    }
}

int CustomAVLTree::rangeQuery(double minAmount, double maxAmount, TransactionRecord* out, int maxOut) const {
    int count = 0;
    rangeWalk(root, minAmount, maxAmount, out, maxOut, count);
    return count;
}

int CustomAVLTree::getSize() const {
    return size;
}

void CustomAVLTree::clear() {
    destroyNode(root);
    root = nullptr;
    size = 0;
}
