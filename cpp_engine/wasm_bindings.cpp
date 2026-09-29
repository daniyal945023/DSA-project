#include "ReconciliationEngine.hpp"

#include <cstdio>
#include <cstring>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#ifndef EMSCRIPTEN_KEEPALIVE
#define EMSCRIPTEN_KEEPALIVE
#endif
#endif

static ReconciliationEngine* gEngine = nullptr;

static void appendC(char* dest, int& len, int cap, const char* src) {
    if (!src) {
        return;
    }
    for (int i = 0; src[i] != '\0' && len < cap - 1; ++i) {
        dest[len++] = src[i];
    }
}

static void appendEscaped(char* dest, int& len, int cap, const char* src) {
    if (!src) {
        return;
    }
    for (int i = 0; src[i] != '\0' && len < cap - 2; ++i) {
        char c = src[i];
        if (c == '"' || c == '\\') {
            if (len < cap - 3) {
                dest[len++] = '\\';
                dest[len++] = c;
            }
        } else if (static_cast<unsigned char>(c) < 32) {
            continue;
        } else {
            dest[len++] = c;
        }
    }
}

static char* makeJsonFromRecords(const TransactionRecord* rows, int count) {
    const int cap = 256 * 1024;
    char* buf = new char[cap];
    int len = 0;
    appendC(buf, len, cap, "[");
    for (int i = 0; i < count; ++i) {
        if (i > 0) {
            appendC(buf, len, cap, ",");
        }
        appendC(buf, len, cap, "{\"id\":\"");
        appendEscaped(buf, len, cap, rows[i].id);
        appendC(buf, len, cap, "\",\"date\":\"");
        appendEscaped(buf, len, cap, rows[i].date);
        appendC(buf, len, cap, "\",\"amount\":");
        char num[64];
        std::snprintf(num, 64, "%.2f", rows[i].amount);
        appendC(buf, len, cap, num);
        appendC(buf, len, cap, ",\"memo\":\"");
        appendEscaped(buf, len, cap, rows[i].memo);
        appendC(buf, len, cap, "\",\"status\":\"");
        appendEscaped(buf, len, cap, rows[i].status);
        appendC(buf, len, cap, "\"}");
    }
    appendC(buf, len, cap, "]");
    buf[len] = '\0';
    return buf;
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
void init_engine() {
    if (gEngine) {
        delete gEngine;
    }
    gEngine = new ReconciliationEngine();
}

EMSCRIPTEN_KEEPALIVE
int load_csv_data(const char* bank_csv_str, const char* gl_csv_str) {
    if (!gEngine) {
        init_engine();
    }
    bool ok = gEngine->loadFromStrings(bank_csv_str, gl_csv_str);
    return ok ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
char* get_summary_stats() {
    if (!gEngine) {
        init_engine();
    }
    SummaryStats s = gEngine->getStats();
    char* buf = new char[1024];
    std::snprintf(
        buf, 1024,
        "{\"bankCount\":%d,\"glCount\":%d,\"matchedCount\":%d,\"unmatchedBankCount\":%d,"
        "\"unmatchedGlCount\":%d,\"totalBankVolume\":%.2f,\"matchedVolume\":%.2f,"
        "\"unmatchedBankVolume\":%.2f,\"unmatchedGlVolume\":%.2f,\"matchRate\":%.4f,"
        "\"processMs\":%ld,\"unreconciledValue\":%.2f}",
        s.bankCount, s.glCount, s.matchedCount, s.unmatchedBankCount, s.unmatchedGlCount,
        s.totalBankVolume, s.matchedVolume, s.unmatchedBankVolume, s.unmatchedGlVolume,
        s.matchRate, s.processMs, s.unmatchedBankVolume + s.unmatchedGlVolume);
    return buf;
}

EMSCRIPTEN_KEEPALIVE
char* get_top_discrepancies() {
    if (!gEngine) {
        init_engine();
    }
    TransactionRecord rows[64];
    int n = gEngine->getTopDiscrepancies(rows, 64);
    return makeJsonFromRecords(rows, n);
}

EMSCRIPTEN_KEEPALIVE
char* get_ledger() {
    if (!gEngine) {
        init_engine();
    }
    TransactionRecord rows[512];
    int n = gEngine->getLedgerSnapshot(rows, 512);
    return makeJsonFromRecords(rows, n);
}

EMSCRIPTEN_KEEPALIVE
char* search_memo_prefix(const char* prefix) {
    if (!gEngine) {
        init_engine();
    }
    char results[32][128];
    int n = gEngine->searchMemos(prefix ? prefix : "", results, 32);
    const int cap = 16 * 1024;
    char* buf = new char[cap];
    int len = 0;
    appendC(buf, len, cap, "[");
    for (int i = 0; i < n; ++i) {
        if (i > 0) {
            appendC(buf, len, cap, ",");
        }
        appendC(buf, len, cap, "\"");
        appendEscaped(buf, len, cap, results[i]);
        appendC(buf, len, cap, "\"");
    }
    appendC(buf, len, cap, "]");
    buf[len] = '\0';
    return buf;
}

EMSCRIPTEN_KEEPALIVE
char* query_amount_range(double min_amount, double max_amount) {
    if (!gEngine) {
        init_engine();
    }
    TransactionRecord rows[128];
    int n = gEngine->queryRange(min_amount, max_amount, rows, 128);
    return makeJsonFromRecords(rows, n);
}

EMSCRIPTEN_KEEPALIVE
char* export_report_csv() {
    if (!gEngine) {
        init_engine();
    }
    gEngine->exportReport("reconciliation_report.csv");
    return gEngine->exportReportToString();
}

EMSCRIPTEN_KEEPALIVE
void free_string(char* ptr) {
    delete[] ptr;
}

}
