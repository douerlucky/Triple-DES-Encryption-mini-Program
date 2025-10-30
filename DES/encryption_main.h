#ifndef ENCRYPTION_MAIN_H
#define ENCRYPTION_MAIN_H

#include <string>
#include <vector>
#include <cstdint>

using namespace std;

// 辅助函数
vector<uint64_t> _tackle_m_file_to_int_list(const string& m_hex);
vector<uint64_t> _tackle_c_file_to_int_list(const string& c_hex);
string _convert_int_list_to_hex(const vector<uint64_t>& int_list);
vector<uint64_t> _unpad_int_list(const vector<uint64_t>& int_list);

// 主加密/解密函数
string encryption(uint64_t k1_int, uint64_t k2_int, uint64_t k3_int,
                       const string& m_hex, uint64_t IV_int);

string decryption(uint64_t k1_int, uint64_t k2_int, uint64_t k3_int,
                       const string& c_hex, uint64_t IV_int);

#endif // ENCRYPTION_MAIN_H