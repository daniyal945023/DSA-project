CXX ?= g++
EMCC ?= emcc
CXXFLAGS ?= -std=c++17 -Wall -Wextra -O2 -Iinclude
SRC = src/CustomHashTable.cpp src/CustomMaxHeap.cpp src/CustomDoublyLinkedList.cpp \
      src/CustomTrie.cpp src/CustomAVLTree.cpp src/ReconciliationEngine.cpp
WASM_OUT = ../public/wasm
WASM_FUNCS = _init_engine,_load_csv_data,_get_summary_stats,_get_top_discrepancies,_get_ledger,_search_memo_prefix,_query_amount_range,_export_report_csv,_free_string,_malloc,_free

.PHONY: all test native wasm clean

all: native

native: recon_cli

recon_cli: main.cpp $(SRC)
	$(CXX) $(CXXFLAGS) main.cpp $(SRC) -o recon_cli

test: recon_cli
	./recon_cli

wasm:
	mkdir -p $(WASM_OUT)
	$(EMCC) -std=c++17 -O3 -Iinclude wasm_bindings.cpp $(SRC) \
		-s WASM=1 \
		-s MODULARIZE=1 \
		-s EXPORT_ES6=0 \
		-s EXPORT_NAME="createEngineModule" \
		-s EXPORTED_FUNCTIONS='[$(WASM_FUNCS)]' \
		-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","stringToUTF8","lengthBytesUTF8","HEAPU8"]' \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s FORCE_FILESYSTEM=1 \
		-s ENVIRONMENT="web,worker" \
		-o $(WASM_OUT)/engine.js

clean:
	rm -f recon_cli recon_cli.exe test_gl.csv test_bank.csv reconciliation_report.csv
	rm -f $(WASM_OUT)/engine.js $(WASM_OUT)/engine.wasm
