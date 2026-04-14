"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

const profileSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    phone_number: z.string().min(10, "Invalid phone number"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.string().min(1, "Gender is required"),
    address: z.string().min(5, "Address is too short"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileStepProps {
    data: any;
    onUpdate: (data: any) => void;
    onNext: () => void;
}

export function ProfileStep({ data, onUpdate, onNext }: ProfileStepProps) {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone_number: data.phone_number,
            dob: data.dob ? data.dob.slice(0, 10) : "",
            gender: String(data.gender),
            address: data.address,
        },
    });

    const onSubmit = async (values: any) => {
        try {
            await api.saveOnboardingDraft({
                userId: data.userId,
                email: data.email,
                firstName: values.firstName,
                lastName: values.lastName,
                phone_number: values.phone_number,
                address: values.address,
                dob: values.dob,
                gender: Number(values.gender)
            });
            onUpdate({
                ...values,
                gender: Number(values.gender),
            });
            onNext();
        } catch (error) {
            console.error("Failed to save draft:", error);
            // Continue even if draft save fails to avoid blocking the user
            onNext();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Welcome to ABIA MFB</h2>
                <p className="text-muted-foreground">Let's start with your basic profile details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...register("firstName")} placeholder="John" />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...register("lastName")} placeholder="Doe" />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input id="phone_number" {...register("phone_number")} placeholder="08012345678" />
                    {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" {...register("dob")} />
                    {errors.dob && <p className="text-sm text-destructive">{errors.dob.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                        defaultValue={String(data.gender)} 
                        onValueChange={(val) => setValue("gender", val)}
                    >
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Male</SelectItem>
                            <SelectItem value="1">Female</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-sm text-destructive">{errors.gender.message as string}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Residential Address</Label>
                    <Input id="address" {...register("address")} placeholder="123 Example Street, Abia" />
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message as string}</p>}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full sm:w-auto px-12 group">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
        </form>
    );
}
