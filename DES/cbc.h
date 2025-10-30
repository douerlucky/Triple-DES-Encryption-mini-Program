#ifndef CBC_H
#define CBC_H

#include <vector>
#include <cstdint>

using namespace std;

vector<uint64_t> cbc_enc(uint64_t k1, uint64_t k2, uint64_t k3,
                                const vector<uint64_t>& m_list, uint64_t IV);

vector<uint64_t> cbc_dec(uint64_t k1, uint64_t k2, uint64_t k3,
                                const vector<uint64_t>& c_list, uint64_t IV);

vector<uint64_t> cbc_enc_fast(uint64_t k1, uint64_t k2, uint64_t k3,
                                     const vector<uint64_t>& m_list, uint64_t IV);

vector<uint64_t> cbc_dec_fast(uint64_t k1, uint64_t k2, uint64_t k3,
                                     const vector<uint64_t>& c_list, uint64_t IV);

#endif // CBC_H