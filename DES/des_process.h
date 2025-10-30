#ifndef DES_PROCESS_H
#define DES_PROCESS_H

#include <vector>
#include <cstdint>

using namespace std;

// 置换表
extern const vector<int> IP_TABLE;
extern const vector<int> PS1_TABLE;
extern const vector<int> PS2_TABLE;
extern const vector<int> EP_TABLE;
extern const vector<int> P_TABLE;
extern const vector<int> IP_REVERSE_TABLE;

// S盒
extern const vector<vector<vector<int>>> S_BOXES;

// 全局变量
extern vector<uint64_t> k_bins;

// 函数声明
void init_masks();
uint64_t IP(uint64_t bin_val);
uint64_t IP_reverse(uint64_t bin_val);
void key_extension(uint64_t bin_val);
uint64_t cal_func(uint32_t L, uint32_t R, int iter_num);
uint32_t round_func(uint32_t R, uint64_t k);

#endif // DES_PROCESS_H