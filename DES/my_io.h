#ifndef MY_IO_H
#define MY_IO_H

#include <string>

using namespace std;

string input_hex16(const string& dec_str);
string auto_input_m(const string& m_hex);
string auto_input_k(const string& k_hex);
string read_file_as_hex(const string& file_path);

#endif // MY_IO_H