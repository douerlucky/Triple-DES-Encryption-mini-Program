#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <vector>
#include <cstdint>

using namespace std;

string hex_to_bin64(const string& hex_str);
string left_shift(const string& bin_str, int shift_num);
string xor_48(const string& EP_str, const string& k);
string xor_32(const string& L, const string& f_str);
string xor_64(const string& m, const string& c);
string bin_to_hex16(const string& bin_str);
string fill_8bytes_str(const string& input_str);
int delete_8bytes_str(const string& input_str);

#endif // UTILS_H