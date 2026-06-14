"use client";

import { useState } from "react";
import { Button, Input, InputNumber, List, Tag, Typography, Empty } from "antd";
import { ShopItem } from "@/types/mandal";

const { Text } = Typography;

interface Props {
  items: ShopItem[];
  totalPoints: number;
  onBuy: (itemId: string) => void;
  onAdd: (name: string, cost: number) => void;
  onRemove: (itemId: string) => void;
  onEdit: (itemId: string, name: string, cost: number) => void;
}

export default function Shop({ items, totalPoints, onBuy, onAdd, onRemove, onEdit }: Props) {
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCost, setEditCost] = useState<number | null>(null);

  const handleAdd = () => {
    if (!newName.trim() || !newCost || newCost <= 0) return;
    onAdd(newName.trim(), newCost);
    setNewName("");
    setNewCost(null);
  };

  const startEdit = (item: ShopItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCost(item.cost);
  };

  const confirmEdit = () => {
    if (!editingId || !editName.trim() || !editCost || editCost <= 0) return;
    onEdit(editingId, editName.trim(), editCost);
    setEditingId(null);
    setEditName("");
    setEditCost(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCost(null);
  };

  const sorted = [...items].sort((a, b) => a.cost - b.cost);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <Text type="secondary">Available points</Text>
        <Text strong style={{ fontSize: "20px" }}>{totalPoints} C$</Text>
      </div>

      {sorted.length === 0 ? (
        <Empty description="No rewards yet — add one below" />
      ) : (
        <List
          dataSource={sorted}
          renderItem={(item) => {
            const canAfford = totalPoints >= item.cost;
            const isEditing = editingId === item.id;

            return (
              <List.Item
                actions={
                  isEditing
                    ? [
                        <Button key="confirm" type="primary" size="small" onClick={confirmEdit}>
                          Save
                        </Button>,
                        <Button key="cancel" size="small" onClick={cancelEdit}>
                          Cancel
                        </Button>,
                      ]
                    : [
                        <Button
                          key="buy"
                          type="primary"
                          size="small"
                          disabled={!canAfford}
                          onClick={() => onBuy(item.id)}
                        >
                          Buy
                        </Button>,
                        <Button key="edit" size="small" onClick={() => startEdit(item)}>
                          Edit
                        </Button>,
                        <Button key="remove" size="small" danger onClick={() => onRemove(item.id)}>
                          Remove
                        </Button>,
                      ]
                }
              >
                {isEditing ? (
                  <div style={{ display: "flex", gap: "8px", flex: 1, marginRight: "12px" }}>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Reward name"
                      style={{ flex: 2 }}
                      onPressEnter={confirmEdit}
                    />
                    <InputNumber
                      value={editCost}
                      onChange={(val) => setEditCost(val)}
                      placeholder="Cost"
                      min={1}
                      style={{ flex: 1 }}
                    />
                  </div>
                ) : (
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Tag color={canAfford ? "green" : "default"}>
                        {item.cost} C$
                      </Tag>
                    }
                  />
                )}
              </List.Item>
            );
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          paddingTop: "16px",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Reward name"
          style={{ flex: 2 }}
          onPressEnter={handleAdd}
        />
        <InputNumber
          value={newCost}
          onChange={(val) => setNewCost(val)}
          placeholder="Cost"
          min={1}
          style={{ flex: 1 }}
        />
        <Button type="primary" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}