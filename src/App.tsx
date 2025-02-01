import { useState, useEffect } from "react";
import { Binary, TreePine } from "lucide-react";

class HuffmanTreeNode {
  data: string;
  freq: number;
  children: HuffmanTreeNode[];

  constructor(character: string, frequency: number) {
    this.data = character;
    this.freq = frequency;
    this.children = [];
  }
}

class PriorityQueue {
  private nodes: HuffmanTreeNode[];

  constructor() {
    this.nodes = [];
  }

  enqueue(node: HuffmanTreeNode) {
    this.nodes.push(node);
    this.sort();
  }

  dequeue(): HuffmanTreeNode | undefined {
    return this.nodes.shift();
  }

  sort() {
    this.nodes.sort((a, b) => {
      // Primary sort by frequency
      if (a.freq !== b.freq) return a.freq - b.freq;
      // Secondary sort by data (for consistent ordering of equal frequencies)
      return a.data.localeCompare(b.data);
    });
  }

  get size(): number {
    return this.nodes.length;
  }

  getNodes(): HuffmanTreeNode[] {
    return [...this.nodes];
  }
}

function calculateRequiredDummies(symbolCount: number, m: number): number {
  // For m-ary Huffman, we need (n-1) mod (m-1) = 0
  // where n is the total number of symbols including dummies
  const remainder = (symbolCount - 1) % (m - 1);
  if (remainder === 0) return 0;
  return m - 1 - remainder;
}

function generateMaryTree(
  frequencies: Map<string, number>,
  m: number
): HuffmanTreeNode | null {
  const pq = new PriorityQueue();

  // Create leaf nodes from actual symbols
  for (const [char, freq] of frequencies.entries()) {
    pq.enqueue(new HuffmanTreeNode(char, freq));
  }

  // Handle special cases
  if (pq.size === 0) return null;
  if (pq.size === 1) return pq.dequeue()!;

  // Add dummy nodes if needed
  const dummiesNeeded = calculateRequiredDummies(pq.size, m);
  for (let i = 0; i < dummiesNeeded; i++) {
    pq.enqueue(new HuffmanTreeNode(`dummy${i}`, 0));
  }

  // Build the tree
  while (pq.size > 1) {
    const numNodes = Math.min(m, pq.size);
    const newNode = new HuffmanTreeNode("internal", 0);
    let totalFreq = 0;

    // Take exactly m nodes (or all remaining if less than m)
    for (let i = 0; i < numNodes; i++) {
      const child = pq.dequeue();
      if (child) {
        newNode.children.push(child);
        totalFreq += child.freq;
      }
    }

    newNode.freq = totalFreq;
    pq.enqueue(newNode);
  }

  return pq.dequeue()!;
}

function generateCodes(
  node: HuffmanTreeNode | null,
  currentCode: string,
  codes: Map<string, string>
): void {
  if (!node) return;

  // If it's a leaf node (contains a character) and not a dummy node
  if (node.data !== "internal" && !node.data.startsWith("dummy")) {
    codes.set(node.data, currentCode || "0"); // Use "0" for single-character input
    return;
  }

  // Recursively generate codes for children
  node.children.forEach((child, index) => {
    generateCodes(child, currentCode + index.toString(), codes);
  });
}

function App() {
  const [inputText, setInputText] = useState("aabbbccccc");
  const [mValue, setMValue] = useState(3);
  const [encodedText, setEncodedText] = useState("");
  const [compressionRatio, setCompressionRatio] = useState(0);
  const [huffmanCodes, setHuffmanCodes] = useState<Map<string, string>>(
    new Map()
  );
  const [frequencies, setFrequencies] = useState<Map<string, number>>(
    new Map()
  );

  const calculateFrequencies = (text: string): Map<string, number> => {
    const freq = new Map<string, number>();
    for (const char of text) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    return freq;
  };

  const encode = (text: string, m: number) => {
    if (!text) return "";

    // Calculate frequencies
    const freq = calculateFrequencies(text);
    setFrequencies(freq);

    // Generate Huffman tree
    const root = generateMaryTree(freq, m);

    // Generate codes
    const codes = new Map<string, string>();
    generateCodes(root, "", codes);
    setHuffmanCodes(codes);

    // Encode the text
    let encoded = "";
    for (const char of text) {
      const code = codes.get(char);
      if (code) encoded += code;
    }

    // Calculate compression ratio
    const originalBits = text.length * 8;
    const compressedBits = encoded.length;
    const ratio = (
      ((originalBits - compressedBits) / originalBits) *
      100
    ).toFixed(2);
    setCompressionRatio(Number(ratio));

    return encoded;
  };

  useEffect(() => {
    const encoded = encode(inputText, mValue);
    setEncodedText(encoded);
  }, [inputText, mValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <TreePine className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                M-ary Huffman Coding Visualizer
              </h1>
              <p className="text-gray-600 mt-1">
                Visualize and analyze M-ary Huffman compression in real-time
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input Controls */}
          <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Input Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text to Compress
                  </label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Enter text to compress..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M Value (2-5)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="5"
                    value={mValue}
                    onChange={(e) => setMValue(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Frequencies and Codes */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Character Analysis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from(frequencies.entries()).map(([char, freq]) => (
                  <div
                    key={char}
                    className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-lg bg-white px-3 py-1 rounded-md shadow-sm">
                        {char === " " ? "␣" : char}
                      </span>
                      <span className="font-mono text-sm text-gray-600">
                        Freq: {freq}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-sm text-indigo-600 bg-white px-3 py-1 rounded-md shadow-sm">
                      Code: {huffmanCodes.get(char)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Output and Visualization */}
          <div className="space-y-6">
            {/* Encoded Output */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Encoded Output
              </h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono overflow-x-auto shadow-inner">
                {encodedText || "No encoded output yet"}
              </div>
            </div>

            {/* Compression Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Binary className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Compression Statistics
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Original Size</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {inputText.length * 8} bits
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Compressed Size</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {encodedText.length} bits
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Compression Ratio</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {compressionRatio}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
