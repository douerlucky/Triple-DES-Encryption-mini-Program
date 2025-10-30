#include "cbc.h"
#include "three_des.h"
#include "des_process.h"
#include <iostream>

using namespace std;

vector<uint64_t> cbc_enc(uint64_t k1, uint64_t k2, uint64_t k3,
                              const vector<uint64_t> &m_list, uint64_t IV)
{
    // CBC加密
    int n = m_list.size();
    vector<uint64_t> cbc_c_list; // 本地列表，保存密文整数块

    for (int i = 0; i < n; i++)
    {
        // 1. 异或操作
        uint64_t cur_m_block = m_list[i];
        uint64_t after_xor;

        if (i == 0)
        {
            // 明文块 1 异或 IV
            after_xor = cur_m_block ^ IV;
        }
        else
        {
            // 其他块:明文块 i 异或 上一块密文 C[i-1]
            after_xor = cur_m_block ^ cbc_c_list[i - 1];
        }

        // 3DES 加密
        uint64_t cur_enc = three_des_enc(k1, k2, k3, after_xor);
        // 保存密文块
        cbc_c_list.push_back(cur_enc);
    }
    // 返回密文块的列表
    return cbc_c_list;
}

vector<uint64_t> cbc_dec(uint64_t k1, uint64_t k2, uint64_t k3,
                              const vector<uint64_t> &c_list, uint64_t IV)
{
    // CBC 解密模式 (基于整数位运算)
    int n = c_list.size();
    vector<uint64_t> cbc_m_list; // 本地列表，保存明文整数块

    for (int i = 0; i < n; i++)
    {
        uint64_t cur_c_block = c_list[i];
        uint64_t cur_dec = three_des_dec(k1, k2, k3, cur_c_block);
        // 2. 异或操作
        uint64_t after_xor;
        if (i == 0)
        {
            // C1 异或 IV
            after_xor = cur_dec ^ IV;
        }
        else
        {
            // 其他块: D(Ci) 异或 上一块密文 C[i-1]
            uint64_t prev_c_block = c_list[i - 1];
            after_xor = cur_dec ^ prev_c_block;
        }

        // 3. 保存明文块
        cbc_m_list.push_back(after_xor);
    }

    // 返回明文块的列表
    return cbc_m_list;
}

vector<uint64_t> cbc_enc_fast(uint64_t k1, uint64_t k2, uint64_t k3,
                                   const vector<uint64_t> &m_list, uint64_t IV)
{
    key_extension(k1);
    vector<uint64_t> k1_bins = k_bins; //k1的16个子密钥
    key_extension(k2);
    vector<uint64_t> k2_bins = k_bins; //k2的16个子密钥
    key_extension(k3);
    vector<uint64_t> k3_bins = k_bins; //k3的16个子密钥
    // 加密所有块
    vector<uint64_t> cbc_c_list;
    size_t total_blocks = m_list.size();
    size_t progress_interval = total_blocks / 100;  // 每1%输出一次
    if (progress_interval == 0) progress_interval = 1;  // 至少每块输出一次（小文件）

    for (size_t i = 0; i < m_list.size(); i++)
    {
        uint64_t cur_m_block = m_list[i];
        uint64_t after_xor;
        if (i == 0)
        {
            after_xor = cur_m_block ^ IV;
        }
        else
        {
            after_xor = cur_m_block ^ cbc_c_list[i - 1];
        }
        // 调用three_des_enc
        uint64_t cur_enc = three_des_enc(k1, k2, k3, after_xor, &k1_bins, &k2_bins, &k3_bins);
        cbc_c_list.push_back(cur_enc);

        // 输出进度（每1%或每1000块）
        if (i % progress_interval == 0 || i % 1000 == 0 || i == total_blocks - 1)
        {
            int percentage = (int)((i + 1) * 100 / total_blocks);
            cout << "PROGRESS:" << (i + 1) << ":" << total_blocks << ":" << percentage << endl;
            cout.flush();  // 立即刷新输出
        }
    }
    return cbc_c_list;
}

vector<uint64_t> cbc_dec_fast(uint64_t k1, uint64_t k2, uint64_t k3,
                                   const vector<uint64_t> &c_list, uint64_t IV)
{
    key_extension(k1);
    vector<uint64_t> k1_bins = k_bins;
    key_extension(k2);
    vector<uint64_t> k2_bins = k_bins;
    key_extension(k3);
    vector<uint64_t> k3_bins = k_bins;
    vector<uint64_t> cbc_m_list;
    size_t total_blocks = c_list.size();
    size_t progress_interval = total_blocks / 100;  // 每1%输出一次
    if (progress_interval == 0) progress_interval = 1;

    for (size_t i = 0; i < c_list.size(); i++)
    {
        uint64_t cur_c_block = c_list[i];
        uint64_t cur_dec = three_des_dec(k1, k2, k3, cur_c_block, &k1_bins, &k2_bins, &k3_bins);
        uint64_t after_xor;
        if (i == 0)
        {
            after_xor = cur_dec ^ IV;
        }
        else
        {
            uint64_t prev_c_block = c_list[i - 1];
            after_xor = cur_dec ^ prev_c_block;
        }

        cbc_m_list.push_back(after_xor);

        // 输出进度
        if (i % progress_interval == 0 || i % 1000 == 0 || i == total_blocks - 1)
        {
            int percentage = (int)((i + 1) * 100 / total_blocks);
            cout << "PROGRESS:" << (i + 1) << ":" << total_blocks << ":" << percentage << endl;
            cout.flush();
        }
    }

    return cbc_m_list;
}