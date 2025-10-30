#include "my_io.h"
#include "encryption_main.h"
#include <iostream>
#include <fstream>
#include <iomanip>
#include <chrono>
#include <sys/stat.h>
#include <vector>
#include <string>

using namespace std;

// 辅助函数：从十六进制字符串写入二进制文件
void write_hex_to_binary_file(const string &hex_str, const string &file_path)
{
    ofstream file(file_path, ios::binary);
    if (!file)
    {
        cerr << "Error: 无法创建文件: " << file_path << endl;
        exit(1);
    }

    // 将十六进制字符串转换为字节并写入
    for (size_t i = 0; i < hex_str.length(); i += 2)
    {
        string byte_str = hex_str.substr(i, 2);
        char byte = (char)(stoi(byte_str, nullptr, 16));
        file.write(&byte, 1);
    }

    file.close();
}

void print_usage(const char* program_name)
{
    cerr << "用法: " << program_name << " <k1> <k2> <k3> <iv> <encrypt|decrypt> <input_file> <output_file> [extension]" << endl;
    cerr << "参数说明:" << endl;
    cerr << "  k1, k2, k3: 16位十六进制密钥" << endl;
    cerr << "  iv: 16位十六进制初始向量" << endl;
    cerr << "  encrypt|decrypt: 操作模式" << endl;
    cerr << "  input_file: 输入文件路径" << endl;
    cerr << "  output_file: 输出文件路径" << endl;
    cerr << "  extension: (仅解密时需要) 输出文件扩展名" << endl;
    cerr << endl;
    cerr << "示例:" << endl;
    cerr << "  加密: " << program_name << " 133457799BBCDFF1 133457799BBCDFF1 133457799BBCDFF1 0000000000000000 encrypt input.txt output.enc" << endl;
    cerr << "  解密: " << program_name << " 133457799BBCDFF1 133457799BBCDFF1 133457799BBCDFF1 0000000000000000 decrypt input.enc output.txt txt" << endl;
}

int main(int argc, char* argv[])
{
    // 检查参数数量
    if (argc < 8)
    {
        cerr << "Error: 参数不足" << endl;
        print_usage(argv[0]);
        return 1;
    }

    // 解析参数
    string k1_hex = argv[1];
    string k2_hex = argv[2];
    string k3_hex = argv[3];
    string IV_hex = argv[4];
    string operation = argv[5];
    string input_file = argv[6];
    string output_file = argv[7];
    string extension = (argc > 8) ? argv[8] : "";

    // 验证十六进制格式
    auto is_valid_hex = [](const string& s) -> bool {
        if (s.length() != 16) return false;
        for (char c : s) {
            if (!isxdigit(c)) return false;
        }
        return true;
    };

    if (!is_valid_hex(k1_hex) || !is_valid_hex(k2_hex) || !is_valid_hex(k3_hex) || !is_valid_hex(IV_hex))
    {
        cerr << "Error: 密钥或IV格式错误，必须是16位十六进制字符" << endl;
        return 1;
    }

    // 转换为整数
    uint64_t k1_int = stoull(k1_hex, nullptr, 16);
    uint64_t k2_int = stoull(k2_hex, nullptr, 16);
    uint64_t k3_int = stoull(k3_hex, nullptr, 16);
    uint64_t IV_int = stoull(IV_hex, nullptr, 16);

    // 验证操作模式
    if (operation != "encrypt" && operation != "decrypt")
    {
        cerr << "Error: 操作模式必须是 'encrypt' 或 'decrypt'" << endl;
        return 1;
    }

    // 检查输入文件是否存在
    struct stat stat_buf;
    if (stat(input_file.c_str(), &stat_buf) != 0)
    {
        cerr << "Error: 输入文件不存在: " << input_file << endl;
        return 1;
    }

    long file_size = stat_buf.st_size;
    double size_mb = file_size / (1024.0 * 1024.0);

    // 输出日志到stderr（避免干扰stdout的数据传输）
    cerr << "===================================" << endl;
    cerr << "3DES-CBC 命令行版本" << endl;
    cerr << "===================================" << endl;
    cerr << "操作模式: " << (operation == "encrypt" ? "加密" : "解密") << endl;
    cerr << "输入文件: " << input_file << endl;
    cerr << "文件大小: " << fixed << setprecision(2) << size_mb << " MB" << endl;
    cerr << "输出文件: " << output_file << endl;
    cerr << "===================================" << endl;

    try
    {
        if (operation == "encrypt")
        {
            // ========== 加密模式 ==========
            cerr << "开始加密..." << endl;

            // 读取文件为十六进制
            string m_hex = read_file_as_hex(input_file);

            // 开始加密
            auto start_time = chrono::high_resolution_clock::now();
            string c_hex = encryption(k1_int, k2_int, k3_int, m_hex, IV_int);
            auto end_time = chrono::high_resolution_clock::now();

            chrono::duration<double> elapsed = end_time - start_time;

            // 保存为二进制文件
            write_hex_to_binary_file(c_hex, output_file);

            cerr << "加密完成！" << endl;
            cerr << "耗时: " << fixed << setprecision(4) << elapsed.count() << " 秒" << endl;
            cerr << "加密文件已保存: " << output_file << endl;

            // 输出成功标记到stdout（供Node.js捕获）
            cout << "SUCCESS" << endl;
        }
        else if (operation == "decrypt")
        {
            // ========== 解密模式 ==========
            cerr << "开始解密..." << endl;

            // 读取密文文件为十六进制
            string c_hex = read_file_as_hex(input_file);

            // 开始解密
            auto start_time = chrono::high_resolution_clock::now();
            string m_hex = decryption(k1_int, k2_int, k3_int, c_hex, IV_int);
            auto end_time = chrono::high_resolution_clock::now();

            chrono::duration<double> elapsed = end_time - start_time;

            // 保存为二进制文件
            write_hex_to_binary_file(m_hex, output_file);

            cerr << "解密完成！" << endl;
            cerr << "耗时: " << fixed << setprecision(4) << elapsed.count() << " 秒" << endl;
            cerr << "解密文件已保存: " << output_file << endl;

            // 输出成功标记到stdout（供Node.js捕获）
            cout << "SUCCESS" << endl;
        }
    }
    catch (const exception& e)
    {
        cerr << "Error: 处理失败: " << e.what() << endl;
        return 1;
    }

    return 0;
}