#include "my_io.h"
#include "utils.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>

using namespace std;

string input_hex16(const string &dec_str)
{
    cout << "输入64位16进制 " << dec_str << endl;
    string input_hex;
    cin >> input_hex;
    return input_hex;
}

string auto_input_m(const string &m_hex)
{
    string m_bin = hex_to_bin64(m_hex);
    return m_bin;
}

string auto_input_k(const string &k_hex)
{
    string k_bin = hex_to_bin64(k_hex);
    return k_bin;
}

string read_file_as_hex(const string &file_path)
{
    // 以二进制模式读取文件（获取字节流）
    ifstream file(file_path, ios::binary); //ios:: 文件打开模式的标志，告诉系统按原样读取文件的每一个字节
    if (!file)
    {
        return "";
    }

    // 把整个文件读成字节数组
    vector<char> byte_stream((istreambuf_iterator<char>(file)),
                             istreambuf_iterator<char>());
    // istreambuf_iterator - 输入流缓冲迭代器 一个指针，用来遍历文件的每个字节
    // istreambuf_iterator<char>() - 结束迭代器

    // 将字节流转换为十六进制字符串 全大写
    stringstream hex_str;
    hex_str << hex << uppercase << setfill('0');
    // hex表示之后的整数都用十六进制输出
    // 十六进制字母用大写
    // 不够位数时，用'0'填充

    for (char byte: byte_stream)
    {
        hex_str << setw(2) << (int)(unsigned char)byte;
    }

    return hex_str.str();
}