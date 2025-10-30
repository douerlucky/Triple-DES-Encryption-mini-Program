#include "utils.h"
#include <sstream>
#include <iomanip>
#include <algorithm>

using namespace std;

string hex_to_bin64(const string &hex_str)
{
    // 16进制字符串转整数
    uint64_t num = stoull(hex_str, nullptr, 16);

    // 整数转二进制字符串
    string bin_str;
    for (int i = 63; i >= 0; i--)
    {
        bin_str += ((num >> i) & 1) ? '1' : '0';
    }

    return bin_str;
}

string left_shift(const string &bin_str, int shift_num)
{
    // 循环左移
    if (bin_str.length() != 28)
    {
        // 不是28位
        return bin_str;
    }

    if (shift_num == 1)
    {
        // 左移1位
        return bin_str.substr(1) + bin_str[0];
    }
    else
    {
        // 左移2位
        return bin_str.substr(2) + bin_str.substr(0, 2);
    }
}

string xor_48(const string &EP_str, const string &k)
{
    // 进行异或运算
    uint64_t ep_int = stoull(EP_str, nullptr, 2);
    uint64_t k_int = stoull(k, nullptr, 2);
    uint64_t xor_int = ep_int ^ k_int;

    // 转换回48位二进制字符串
    string xor_str;
    for (int i = 47; i >= 0; i--)
    {
        xor_str += ((xor_int >> i) & 1) ? '1' : '0';
    }

    return xor_str;
}

string xor_32(const string &L, const string &f_str)
{
    // 32位异或
    uint32_t l_int = stoul(L, nullptr, 2);
    uint32_t f_int = stoul(f_str, nullptr, 2);
    uint32_t new_r_int = l_int ^ f_int;

    // 转回32位二进制字符串
    string new_R;
    for (int i = 31; i >= 0; i--)
    {
        new_R += ((new_r_int >> i) & 1) ? '1' : '0';
    }

    return new_R;
}

string xor_64(const string &m, const string &c)
{
    // 64位异或
    uint64_t m_int = stoull(m, nullptr, 2);
    uint64_t c_int = stoull(c, nullptr, 2);
    uint64_t xor_int = m_int ^ c_int;

    // 转回64位二进制字符串
    string xor_str;
    for (int i = 63; i >= 0; i--)
    {
        xor_str += ((xor_int >> i) & 1) ? '1' : '0';
    }

    return xor_str;
}

string bin_to_hex16(const string &bin_str)
{
    uint64_t bin_int = stoull(bin_str, nullptr, 2);

    // 整数转十六进制
    stringstream ss;
    ss << hex << uppercase << setfill('0') << setw(16) << bin_int;

    return ss.str();
}

string fill_8bytes_str(const string &input_str)
{
    int str_len = input_str.length() / 2;
    vector<string> return_list = {
        "", "00000000000007", "000000000006", "0000000005",
        "00000004", "000003", "0002", "01", "0000000000000008"
    };
    return return_list[str_len];
}

int delete_8bytes_str(const string &input_str)
{
    int fill_byte_num = input_str[input_str.length() - 1] - '0';

    vector<int> return_dic = {0, 2, 4, 6, 8, 10, 12, 14, 16};

    if (fill_byte_num >= 0 && fill_byte_num < return_dic.size())
    {
        return return_dic[fill_byte_num];
    }
    return 0;
}
