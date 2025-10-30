#include "three_des.h"
#include "des_process.h"

using namespace std;

uint64_t des_enc(uint64_t k, uint64_t m, const vector<uint64_t> *k_bins_ptr)
{
    uint64_t IP_num = IP(m);

    if (k_bins_ptr == nullptr)
    {
        key_extension(k);
    }
    else
    {
        k_bins = *k_bins_ptr;
    }

    uint64_t round_func_num = IP_num;

    for (int i = 0; i < 16; i++)
    {
        uint32_t L = (round_func_num >> 32) & 0xFFFFFFFF;
        uint32_t R = round_func_num & 0xFFFFFFFF;
        round_func_num = cal_func(L, R, i);
    }

    round_func_num = ((round_func_num & 0xFFFFFFFF) << 32) | (round_func_num >> 32);

    uint64_t c = IP_reverse(round_func_num);

    return c;
}

uint64_t des_dec(uint64_t k, uint64_t c, const vector<uint64_t> *k_bins_ptr)
{
    uint64_t IP_num = IP(c);

    if (k_bins_ptr == nullptr)
    {
        key_extension(k);
    }
    else
    {
        k_bins = *k_bins_ptr;
    }

    uint64_t round_func_num = IP_num;

    for (int i = 0; i < 16; i++)
    {
        uint32_t L = (round_func_num >> 32) & 0xFFFFFFFF;
        uint32_t R = round_func_num & 0xFFFFFFFF;
        round_func_num = cal_func(L, R, 15 - i);
    }

    round_func_num = ((round_func_num & 0xFFFFFFFF) << 32) | (round_func_num >> 32);

    uint64_t m = IP_reverse(round_func_num);

    return m;
}

uint64_t three_des_enc(uint64_t k1, uint64_t k2, uint64_t k3, uint64_t m,
                       const vector<uint64_t> *k1_bins_ptr,
                       const vector<uint64_t> *k2_bins_ptr,
                       const vector<uint64_t> *k3_bins_ptr)
{
    vector<uint64_t> k1_bins_local;
    vector<uint64_t> k2_bins_local;
    vector<uint64_t> k3_bins_local;

    if (k1_bins_ptr == nullptr)
    {
        key_extension(k1);
        k1_bins_local = k_bins;
        k1_bins_ptr = &k1_bins_local;
    }

    if (k2_bins_ptr == nullptr)
    {
        key_extension(k2);
        k2_bins_local = k_bins;
        k2_bins_ptr = &k2_bins_local;
    }

    if (k3_bins_ptr == nullptr)
    {
        key_extension(k3);
        k3_bins_local = k_bins;
        k3_bins_ptr = &k3_bins_local;
    }

    uint64_t c1 = des_enc(k1, m, k1_bins_ptr);
    uint64_t c2 = des_dec(k2, c1, k2_bins_ptr);
    uint64_t c3 = des_enc(k3, c2, k3_bins_ptr);
    return c3;
}

uint64_t three_des_dec(uint64_t k1, uint64_t k2, uint64_t k3, uint64_t c,
                       const vector<uint64_t> *k1_bins_ptr,
                       const vector<uint64_t> *k2_bins_ptr,
                       const vector<uint64_t> *k3_bins_ptr)
{
    vector<uint64_t> k1_bins_local;
    vector<uint64_t> k2_bins_local;
    vector<uint64_t> k3_bins_local;

    if (k1_bins_ptr == nullptr)
    {
        key_extension(k1);
        k1_bins_local = k_bins;
        k1_bins_ptr = &k1_bins_local;
    }

    if (k2_bins_ptr == nullptr)
    {
        key_extension(k2);
        k2_bins_local = k_bins;
        k2_bins_ptr = &k2_bins_local;
    }

    if (k3_bins_ptr == nullptr)
    {
        key_extension(k3);
        k3_bins_local = k_bins;
        k3_bins_ptr = &k3_bins_local;
    }

    uint64_t m3 = des_dec(k3, c, k3_bins_ptr);
    uint64_t m2 = des_enc(k2, m3, k2_bins_ptr);
    uint64_t m1 = des_dec(k1, m2, k1_bins_ptr);
    return m1;
}
