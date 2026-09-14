import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Gift } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStocks, useClaimReward } from "@/hooks/useStocks";
import { toast } from "@/hooks/use-toast";

const claimSchema = z.object({
  symbol: z.string().min(1, "Please select a stock"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Quantity must be a positive number",
    })
    .refine((val) => parseFloat(val) <= 1000000, {
      message: "Quantity cannot exceed 1,000,000",
    }),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export function ClaimRewardForm() {
  const { data: stocks = [], isLoading: stocksLoading } = useStocks();
  const claimReward = useClaimReward();

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      symbol: "",
      quantity: "",
    },
  });

  const onSubmit = async (data: ClaimFormData) => {
    try {
      await claimReward.mutateAsync({
        symbol: data.symbol,
        quantity: parseFloat(data.quantity),
      });
      
      toast({
        title: "Reward Claimed Successfully!",
        description: `${data.quantity} units of ${data.symbol} have been submitted for processing.`,
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: "There was an error processing your reward claim. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Claim Stock Reward
        </CardTitle>
        <CardDescription>
          Enter the stock and quantity to claim your reward
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Symbol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={stocksLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stock" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stocks.map((stock) => (
                        <SelectItem key={stock.symbol} value={stock.symbol}>
                          <span className="font-medium">{stock.symbol}</span>
                          <span className="text-muted-foreground ml-2">
                            - {stock.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the stock you want to claim
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      placeholder="0.000000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter quantity up to 6 decimal places (e.g., 0.123456)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={claimReward.isPending}
            >
              {claimReward.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Claim Reward
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
