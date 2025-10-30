#include "des_process.h"

using namespace std;

const vector<int> IP_TABLE = {
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7
};

const vector<int> PS1_TABLE = {
    57, 49, 41, 33, 25, 17, 9,
    1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27,
    19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,
    7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29,
    21, 13, 5, 28, 20, 12, 4
};

const vector<int> PS2_TABLE = {
    14, 17, 11, 24, 1, 5,
    3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8,
    16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32
};

const vector<int> EP_TABLE = {
    32, 1, 2, 3, 4, 5,
    4, 5, 6, 7, 8, 9,
    8, 9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32, 1
};

const vector<int> P_TABLE = {
    16, 7, 20, 21, 29, 12, 28, 17,
    1, 15, 23, 26, 5, 18, 31, 10,
    2, 8, 24, 14, 32, 27, 3, 9,
    19, 13, 30, 6, 22, 11, 4, 25
};

const vector<int> IP_REVERSE_TABLE = {
    40, 8, 48, 16, 56, 24, 64, 32,
    39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30,
    37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26,
    33, 1, 41, 9, 49, 17, 57, 25
};

// ==================== S盒 ====================
const vector<vector<int> > S1 = {
    {14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7},
    {0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8},
    {4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0},
    {15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13}
};

const vector<vector<int> > S2 = {
    {15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10},
    {3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5},
    {0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15},
    {13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9}
};

const vector<vector<int> > S3 = {
    {10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8},
    {13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1},
    {13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7},
    {1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12}
};

const vector<vector<int> > S4 = {
    {7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15},
    {13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9},
    {10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4},
    {3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14}
};

const vector<vector<int> > S5 = {
    {2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9},
    {14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6},
    {4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14},
    {11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3}
};

const vector<vector<int> > S6 = {
    {12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11},
    {10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8},
    {9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6},
    {4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13}
};

const vector<vector<int> > S7 = {
    {4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1},
    {13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6},
    {1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2},
    {6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12}
};

const vector<vector<int> > S8 = {
    {13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7},
    {1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2},
    {7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8},
    {2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11}
};

const vector<vector<vector<int> > > S_BOXES = {S1, S2, S3, S4, S5, S6, S7, S8};


vector<uint64_t> k_bins;



/**
 * IP初始置换
 * 将64位输入按照IP_TABLE重新排列
 * 输出的第i位 = 输入的第IP_TABLE[i]位
 */
uint64_t IP(uint64_t bin_val)
{
    uint64_t result = 0;

    // 遍历输出的64位
    for (int i = 0; i < 64; i++)
    {
        // 查表：输出第i位来自输入的哪一位
        int source_pos = IP_TABLE[i];

        // 从输入中取出第source_pos位（从右往左数，从1开始）
        int bit = (bin_val >> (64 - source_pos)) & 1;

        // 将这一位放到输出的第i位
        result = (result << 1) | bit;
    }

    return result;
}

/**
 * IP逆置换
 * 功能：IP的逆操作，恢复原始排列
 */
uint64_t IP_reverse(uint64_t bin_val)
{
    uint64_t result = 0;

    for (int i = 0; i < 64; i++)
    {
        int source_pos = IP_REVERSE_TABLE[i];
        int bit = (bin_val >> (64 - source_pos)) & 1;
        result = (result << 1) | bit;
    }

    return result;
}

/**
 * PS1置换
 * 密钥置换1
 * 将64位密钥置换为56位
 */
uint64_t PS1(uint64_t bin_val)
{
    uint64_t result = 0;

    for (size_t i = 0; i < PS1_TABLE.size(); i++)
    {
        int source_pos = PS1_TABLE[i];
        int bit = (bin_val >> (64 - source_pos)) & 1;
        result = (result << 1) | bit;
    }

    return result;
}

/**
 * PS2置换
 * 密钥置换2
 * 将56位密钥置换为48位子密钥
 */
uint64_t PS2(uint64_t bin_val)
{
    uint64_t result = 0;

    for (size_t i = 0; i < PS2_TABLE.size(); i++)
    {
        int source_pos = PS2_TABLE[i];
        int bit = (bin_val >> (56 - source_pos)) & 1;
        result = (result << 1) | bit;
    }

    return result;
}

/**
 * EP扩展置换
 * 将32位R扩展为48位
 *
 */
uint64_t EP(uint32_t R)
{
    uint64_t result = 0;

    for (size_t i = 0; i < EP_TABLE.size(); i++)
    {
        int source_pos = EP_TABLE[i];
        int bit = (R >> (32 - source_pos)) & 1;
        result = (result << 1) | bit;
    }

    return result;
}

/**
 * P置换
 * 功能：将32位S盒输出重新排列
 */
uint32_t P(uint32_t input)
{
    uint32_t result = 0;

    for (size_t i = 0; i < P_TABLE.size(); i++)
    {
        int source_pos = P_TABLE[i];
        int bit = (input >> (32 - source_pos)) & 1;
        result = (result << 1) | bit;
    }

    return result;
}

/**
 * 密钥扩展
 * 从64位密钥生成16个48位子密钥
 *   PS1置换（64位 → 56位）
 *   分成C和D（各28位）
 *   循环左移C和D
 *   PS2置换（56位 → 48位）
 */
void key_extension(uint64_t bin_val)
{
    // 每轮的左移次数
    const vector<int> SHIFT_TIMES = {1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1};

    k_bins.clear();

    // PS1置换
    uint64_t PSed_num = PS1(bin_val);

    // 分成C和D（各28位）
    // C是高28位，D是低28位
    uint32_t C = (PSed_num >> 28) & 0xFFFFFFF;  // 0xFFFFFFF = 28个1
    uint32_t D = PSed_num & 0xFFFFFFF;

    // 16轮循环左移和PS2置换
    for (int shift_time: SHIFT_TIMES)
    {
        // 循环左移C和D
        // 例如：左移1位 = (C << 1) | (C >> 27)
        C = ((C << shift_time) | (C >> (28 - shift_time))) & 0xFFFFFFF;
        D = ((D << shift_time) | (D >> (28 - shift_time))) & 0xFFFFFFF;
        // 合并C和D
        uint64_t CD = ((uint64_t) C << 28) | D;
        // PS2置换
        uint64_t k = PS2(CD);
        // 保存子密钥
        k_bins.push_back(k);
    }
}

/**
 * 轮函数cal_func
 * DES的一轮变换
 */
uint64_t cal_func(uint32_t L, uint32_t R, int iter_num)
{
    uint32_t new_L = R;
    uint32_t f_num = round_func(R, k_bins[iter_num]);
    uint32_t new_R = L ^ f_num;

    // 合并新L和新R
    return ((uint64_t) new_L << 32) | new_R;
}

/**
 * 轮函数
 * 对32位R和48位子密钥K进行复杂变换
 */
uint32_t round_func(uint32_t R, uint64_t k)
{
    // EP扩展（32位 → 48位）
    uint64_t EP_num = EP(R);
    // 密钥异或
    uint64_t xor_result = k ^ EP_num;
    // S盒替代（48位 → 32位）
    uint32_t result_32_num = 0;
    // 分成8组，每组6位
    for (int i = 0; i < 8; i++)
    {
        // 取出第i组的6位
        int six_bit = (xor_result >> (48 - (i + 1) * 6)) & 0x3F;
        // S盒
        // 行号 = 第1位和第6位组成的2位数
        int row = ((six_bit >> 4) & 0b10) | (six_bit & 1);
        // 列号 = 中间4位
        int col = (six_bit >> 1) & 0xF;
        // 查S盒
        int converted_num = S_BOXES[i][row][col];
        // 将4位输出拼接到结果中
        result_32_num = (result_32_num << 4) | converted_num;
    }
    // 步骤4：P置换
    uint32_t final_num = P(result_32_num);
    return final_num;
}
