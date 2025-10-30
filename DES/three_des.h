#ifndef THREE_DES_H
#define THREE_DES_H

#include <cstdint>
#include <vector>

using namespace std;

uint64_t des_enc(uint64_t k, uint64_t m, const vector<uint64_t>* k_bins_ptr = nullptr);
uint64_t des_dec(uint64_t k, uint64_t c, const vector<uint64_t>* k_bins_ptr = nullptr);

uint64_t three_des_enc(uint64_t k1, uint64_t k2, uint64_t k3, uint64_t m,
                        const vector<uint64_t>* k1_bins_ptr = nullptr,
                        const vector<uint64_t>* k2_bins_ptr = nullptr,
                        const vector<uint64_t>* k3_bins_ptr = nullptr);

uint64_t three_des_dec(uint64_t k1, uint64_t k2, uint64_t k3, uint64_t c,
                        const vector<uint64_t>* k1_bins_ptr = nullptr,
                        const vector<uint64_t>* k2_bins_ptr = nullptr,
                        const vector<uint64_t>* k3_bins_ptr = nullptr);

#endif // THREE_DES_H