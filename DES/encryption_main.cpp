#include "encryption_main.h"
#include "cbc.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <cmath>


vector<uint64_t> tackle_m_file_to_int_list(const string &m_hex)
{
    // 明文 Hex 字符串 -> 64位整数块列表
    int block_size = 16; // 16 hex chars = 8 bytes
    int file_length = m_hex.length();

    // 1. 分块 (Hex 字符串)
    vector<string> hex_blocks;
    for (int i = 0; i < file_length; i += block_size)
    {
        hex_blocks.push_back(m_hex.substr(i, block_size)); //从(i,i+block_size)的子串
    }

    // 2. 填充 (ANSI X9.23 for 8-byte blocks)
    string last_block_hex = hex_blocks.back();

    // 填充长度 (字节数 P)
    int P = 8 - (last_block_hex.length() / 2);

    // 如果最后一块是完整的，则追加一个全填充块 (P=8)
    if (P == 8 && last_block_hex.length() == static_cast<size_t>(block_size))
    {
        P = 8;
        stringstream padding_hex;
        padding_hex << hex << uppercase << setfill('0');
        // ANSI X9.23: 前面填充0x00
        for (int i = 0; i < P - 1; i++)
        {
            padding_hex << "00";  // 填充 00
        }
        // 最后一个字节是填充长度
        padding_hex << setw(2) << P;
        hex_blocks.push_back(padding_hex.str());
    }
    else
    {
        // 否则，在当前块末尾追加填充
        stringstream padding_hex;
        padding_hex << hex << uppercase << setfill('0');
        // ANSI X9.23: 前面填充0x00
        for (int i = 0; i < P - 1; i++)
        {
            padding_hex << "00";  // 填充 00
        }
        // 最后一个字节是填充长度
        padding_hex << setw(2) << P;
        hex_blocks.back() = last_block_hex + padding_hex.str();
    }

    // 3. 转换 Hex -> Int
    vector<uint64_t> int_blocks;
    for (const auto &block_hex: hex_blocks)
    {
        int_blocks.push_back(stoull(block_hex, nullptr, 16));
    }

    return int_blocks;
}

vector<uint64_t> tackle_c_file_to_int_list(const string &c_hex)
{
    // 密文 Hex 字符串 -> 64位整数块列表 (无填充处理)
    int block_size = 16; // 16 hex chars = 8 bytes
    int file_length = c_hex.length();

    vector<uint64_t> int_blocks;
    for (int i = 0; i < file_length; i += block_size)
    {
        int_blocks.push_back(stoull(c_hex.substr(i, block_size), nullptr, 16));
    }

    return int_blocks;
}

string convert_int_list_to_hex(const vector<uint64_t> &int_list)
{
    // 64位整数列表 -> 十六进制字符串
    stringstream hex_str;
    hex_str << hex << uppercase << setfill('0');

    for (uint64_t val: int_list)
    {
        // 64位整数转换为 16字符的十六进制 (高位补0)
        hex_str << setw(16) << val;
    }

    return hex_str.str();
}

vector<uint64_t> unpad_int_list(const vector<uint64_t> &int_list)
{
    // ANSI X9.23 去填充

    if (int_list.empty())
    {
        return {};
    }

    vector<uint64_t> new_list = int_list;
    uint64_t last_int = new_list.back();

    // 1. 提取填充字节数 P (最后一个字节的值)
    int P = last_int & 0xFF;

    // 2. 校验 P 的范围 (1 <= P <= 8)
    if (P < 1 || P > 8)
    {
        // 填充值无效，返回未去填充的列表
        return new_list;
    }

    // 3. 验证前面的填充字节是否都是0x00（ANSI X9.23特性）
    // 提取最后P个字节
    for (int i = 1; i < P; i++)
    {
        int byte_val = (last_int >> (8 * i)) & 0xFF;
        if (byte_val != 0x00)
        {
            // 不是ANSI X9.23填充，返回原列表
            return new_list;
        }
    }

    // 4. 计算需要移除的位数 (P * 8 bits)
    int shift_bits = P * 8;

    // 5. 去除填充
    uint64_t unpadded_int = last_int >> shift_bits;

    // 6. 更新列表或移除块
    if (P == 8)
    {
        new_list.pop_back();
    }
    else
    {
        // 更新列表中的最后一个块
        new_list.back() = unpadded_int;
    }

    return new_list;
}


string encryption(uint64_t k1_int, uint64_t k2_int, uint64_t k3_int,
                  const string &m_hex, uint64_t IV_int)
{
    // 加密
    // 将明文十六进制字符串分块并转换为整数列表
    vector<uint64_t> m_int_blocks = tackle_m_file_to_int_list(m_hex);
    int total_blocks = m_int_blocks.size();
    cerr << "\n[加密] 总块数: " << total_blocks << endl;
    // 正式加密（会输出实时进度到stdout）
    vector<uint64_t> c_int_blocks = cbc_enc_fast(k1_int, k2_int, k3_int, m_int_blocks, IV_int);
    //  将密文整数列表转换回十六进制字符串
    string c_hex = convert_int_list_to_hex(c_int_blocks);

    return c_hex;
}

string decryption(uint64_t k1_int, uint64_t k2_int, uint64_t k3_int,
                  const string &c_hex, uint64_t IV_int)
{
    // 将密文十六进制字符串分块并转换为整数列表
    vector<uint64_t> c_int_blocks = tackle_c_file_to_int_list(c_hex);
    int total_blocks = c_int_blocks.size();
    cerr << "\n[解密] 总块数: " << total_blocks << endl;
    // 正式解密（会输出实时进度到stdout）
    vector<uint64_t> m_int_blocks = cbc_dec_fast(k1_int, k2_int, k3_int, c_int_blocks, IV_int);
    // 去除填充
    vector<uint64_t> unpadded_m_int_blocks = unpad_int_list(m_int_blocks);
    // 将明文整数列表转换回十六进制字符串
    string m_hex = convert_int_list_to_hex(unpadded_m_int_blocks);

    return m_hex;
}