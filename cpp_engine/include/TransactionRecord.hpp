#ifndef TRANSACTION_RECORD_HPP
#define TRANSACTION_RECORD_HPP

struct TransactionRecord {
    char id[32];
    char date[16];
    double amount;
    char memo[128];
    char status[16];
};

inline void copyCStr(char* dest, const char* src, int maxLen) {
    if (!dest || maxLen <= 0) {
        return;
    }
    if (!src) {
        dest[0] = '\0';
        return;
    }
    int i = 0;
    while (src[i] != '\0' && i < maxLen - 1) {
        dest[i] = src[i];
        ++i;
    }
    dest[i] = '\0';
}

inline void initTransaction(TransactionRecord& rec) {
    rec.id[0] = '\0';
    rec.date[0] = '\0';
    rec.amount = 0.0;
    rec.memo[0] = '\0';
    rec.status[0] = '\0';
}

inline void copyTransaction(TransactionRecord& dest, const TransactionRecord& src) {
    copyCStr(dest.id, src.id, 32);
    copyCStr(dest.date, src.date, 16);
    dest.amount = src.amount;
    copyCStr(dest.memo, src.memo, 128);
    copyCStr(dest.status, src.status, 16);
}

inline bool cStrEquals(const char* a, const char* b) {
    if (!a || !b) {
        return a == b;
    }
    int i = 0;
    while (a[i] != '\0' && b[i] != '\0') {
        if (a[i] != b[i]) {
            return false;
        }
        ++i;
    }
    return a[i] == b[i];
}

inline int cStrLength(const char* s) {
    if (!s) {
        return 0;
    }
    int n = 0;
    while (s[n] != '\0') {
        ++n;
    }
    return n;
}

inline int cStrCompare(const char* a, const char* b) {
    if (!a && !b) {
        return 0;
    }
    if (!a) {
        return -1;
    }
    if (!b) {
        return 1;
    }
    int i = 0;
    while (a[i] != '\0' && b[i] != '\0') {
        unsigned char ca = static_cast<unsigned char>(a[i]);
        unsigned char cb = static_cast<unsigned char>(b[i]);
        if (ca != cb) {
            return ca < cb ? -1 : 1;
        }
        ++i;
    }
    if (a[i] == b[i]) {
        return 0;
    }
    return a[i] == '\0' ? -1 : 1;
}

inline bool amountsEqual(double a, double b) {
    double diff = a - b;
    if (diff < 0.0) {
        diff = -diff;
    }
    return diff < 0.005;
}

#endif
